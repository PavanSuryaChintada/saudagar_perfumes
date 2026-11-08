-- 0038_cms_everywhere: the product page and the category/collection pages are built from CMS sections like the
-- home page, and each product can hand-pick its "You may also appreciate" products.
--
-- * 'product-page' (system page): everything below the photos and buy box of every product page.
-- * 'listing-page' (system page): every category and collection page. Its "top picture" and "products" sections
--   are where the page's own banner and product grid go; other sections can sit above or below them.

alter table public.products add column if not exists related_product_ids uuid[] not null default '{}';

do $$
declare pid uuid;
begin
  if not exists (select 1 from public.pages where slug = 'product-page') then
    insert into public.pages (slug, title, layout, is_published, is_system, position)
    values ('product-page', 'Product page (every product)', 'sections', true, true, 90)
    returning id into pid;
    insert into public.website_sections (page_id, section_type, label, position, config) values
      (pid, 'product_composition', 'Composition and details', 0,
       '{"eyebrow": "Atelier Specifications", "heading": "Craft & Olfactory Composition"}'),
      (pid, 'product_reviews', 'Reviews', 1, '{}'),
      (pid, 'product_similar', 'You may also appreciate', 2,
       '{"eyebrow": "Similar Scents", "heading": "You May Also Appreciate", "limit": 4}'),
      (pid, 'product_recent', 'Recently viewed', 3, '{"eyebrow": "Your Journey", "heading": "Recently Viewed"}');
  end if;
  if not exists (select 1 from public.pages where slug = 'listing-page') then
    insert into public.pages (slug, title, layout, is_published, is_system, position)
    values ('listing-page', 'Category & collection pages', 'sections', true, true, 91)
    returning id into pid;
    insert into public.website_sections (page_id, section_type, label, position, config) values
      (pid, 'listing_header', 'Top picture and title', 0, '{}'),
      (pid, 'listing_grid', 'Products with filters', 1, '{}');
  end if;
end $$;

-- The banner and the product grid of category pages can be moved but not removed or hidden.
create or replace function app_private.website_sections_keep_required()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and old.section_type in ('listing_header', 'listing_grid') then
    raise exception 'SECTION_REQUIRED: This section can be moved but not removed. Category pages need it.';
  end if;
  if tg_op = 'UPDATE' and old.section_type in ('listing_header', 'listing_grid') and not new.is_visible then
    raise exception 'SECTION_REQUIRED: This section can be moved but not hidden. Category pages need it.';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
drop trigger if exists website_sections_keep_required on public.website_sections;
create trigger website_sections_keep_required before update or delete on public.website_sections
  for each row when (pg_trigger_depth() = 0)
  execute function app_private.website_sections_keep_required();

-- Hand-picked "You may also appreciate" products come first; without any, they are found automatically.
create or replace function public.similar_products(p_slug text, p_limit int default 4)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare picked uuid[];
begin
  select related_product_ids into picked from public.products where slug = p_slug;
  if coalesce(array_length(picked, 1), 0) > 0 then
    return coalesce((
      select jsonb_agg(public.product_card(p.id) order by array_position(picked, p.id))
      from public.products p
      where p.id = any (picked) and p.is_active and p.archived_at is null), '[]'::jsonb);
  end if;
  return (
    with me as (
      select id, primary_category_id from public.products where slug = p_slug
    ),
    my_notes as (select note_id from public.product_notes where product_id = (select id from me)),
    my_family as (
      select pa.option_id from public.product_attributes pa join public.attribute_options o on o.id = pa.option_id
      where pa.product_id = (select id from me) and o.kind = 'family' and pa.is_primary),
    my_accords as (
      select pa.option_id from public.product_attributes pa join public.attribute_options o on o.id = pa.option_id
      where pa.product_id = (select id from me) and o.kind = 'accord'),
    scored as (
      select p.id,
        2 * (select count(*) from public.product_notes pn where pn.product_id = p.id and pn.note_id in (select note_id from my_notes))
        + 3 * (select count(*) from public.product_attributes pa where pa.product_id = p.id and pa.is_primary and pa.option_id in (select option_id from my_family))
        + (select count(*) from public.product_attributes pa where pa.product_id = p.id and pa.option_id in (select option_id from my_accords))
          as score,
        (p.primary_category_id is not distinct from (select primary_category_id from me)) as same_category,
        p.units_sold
      from public.products p
      where p.is_active and p.archived_at is null and not p.is_gift_pack
        and p.id <> coalesce((select id from me), '00000000-0000-0000-0000-000000000000')
    )
    select coalesce(jsonb_agg(public.product_card(s.id) order by s.score desc, s.same_category desc, s.units_sold desc), '[]'::jsonb)
    from (select * from scored order by score desc, same_category desc, units_sold desc limit greatest(least(p_limit, 12), 1)) s
    where exists (select 1 from me));
end $$;
grant execute on function public.similar_products(text, int) to anon, authenticated;

create or replace function public.save_product(payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  is_new boolean := false;
  pid uuid := nullif(payload ->> 'id', '')::uuid;
  v jsonb;
  m jsonb;
  vid uuid;
  keep_ids uuid[] := '{}';
  old_variant record;
  pos int;
  initial int;
  cid uuid;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can change products.';
  end if;

  begin
    if pid is null then
      if coalesce(nullif(payload ->> 'stock_unit', ''), 'ml') not in ('ml', 'piece') then
        raise exception 'STOCK_UNIT: Choose ml or pieces.';
      end if;
      insert into public.products (slug, name, base_price, stock_unit)
      values (payload ->> 'slug', payload ->> 'name', (payload ->> 'base_price')::numeric, coalesce(nullif(payload ->> 'stock_unit', ''), 'ml'))
      returning id into pid;
      is_new := true;
    end if;
    update public.products set
      slug = payload ->> 'slug',
      name = trim(payload ->> 'name'),
      short_description = nullif(payload ->> 'short_description', ''),
      description = nullif(payload ->> 'description', ''),
      primary_category_id = nullif(payload ->> 'primary_category_id', '')::uuid,
      base_price = (payload ->> 'base_price')::numeric,
      compare_at_price = nullif(payload ->> 'compare_at_price', '')::numeric,
      badge = nullif(payload ->> 'badge', ''),
      concentration_note = nullif(payload ->> 'concentration_note', ''),
      is_featured = coalesce((payload ->> 'is_featured')::boolean, false),
      is_active = coalesce((payload ->> 'is_active')::boolean, false),
      counts_toward_samples = coalesce((payload ->> 'counts_toward_samples')::boolean, true),
      ships_surface_only = coalesce((payload ->> 'ships_surface_only')::boolean, false),
      perfumer = nullif(payload ->> 'perfumer', ''),
      launch_year = nullif(payload ->> 'launch_year', '')::int,
      inspiration = nullif(payload ->> 'inspiration', ''),
      how_to_wear = nullif(payload ->> 'how_to_wear', ''),
      country_of_origin = nullif(payload ->> 'country_of_origin', ''),
      manufacturer_name = nullif(payload ->> 'manufacturer_name', ''),
      manufacturer_address = nullif(payload ->> 'manufacturer_address', ''),
      packer_name = nullif(payload ->> 'packer_name', ''),
      packer_address = nullif(payload ->> 'packer_address', ''),
      importer_name = nullif(payload ->> 'importer_name', ''),
      importer_address = nullif(payload ->> 'importer_address', ''),
      consumer_care = nullif(payload ->> 'consumer_care', ''),
      shelf_life = nullif(payload ->> 'shelf_life', ''),
      ingredients = nullif(payload ->> 'ingredients', ''),
      allergens = nullif(payload ->> 'allergens', ''),
      caution_text = nullif(payload ->> 'caution_text', ''),
      hsn_code = nullif(payload ->> 'hsn_code', ''),
      gst_rate = nullif(payload ->> 'gst_rate', '')::numeric,
      seo_title = nullif(payload ->> 'seo_title', ''),
      seo_description = nullif(payload ->> 'seo_description', ''),
      admin_note = nullif(payload ->> 'admin_note', ''),
      related_product_ids = case
        when payload ? 'related_product_ids' then coalesce((
          select array_agg(x::uuid order by o)
          from jsonb_array_elements_text(payload -> 'related_product_ids') with ordinality as e(x, o)
          where x ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' and x::uuid <> pid), '{}')
        else related_product_ids end
    where id = pid;
    if not found then
      raise exception 'PRODUCT_NOT_FOUND: This product no longer exists.';
    end if;
  exception when unique_violation then
    raise exception 'SLUG_TAKEN: Another product already uses the link "%". Choose a different one.', payload ->> 'slug';
  end;

  -- variants: update by id, insert new, retire or delete removed
  for v in select * from jsonb_array_elements(coalesce(payload -> 'variants', '[]'::jsonb)) loop
    vid := nullif(v ->> 'id', '')::uuid;
    if vid is not null and exists (select 1 from public.product_variants where id = vid and product_id = pid) then
      keep_ids := keep_ids || vid;
    end if;
  end loop;

  for old_variant in select id, stock, units_sold from public.product_variants where product_id = pid and purpose is null and not (id = any (keep_ids)) loop
    if old_variant.units_sold > 0 then
      if old_variant.stock > 0 and (select stock_unit from public.products where id = pid) = 'piece' then
        perform app_private.apply_stock_change(old_variant.id, -old_variant.stock, 'correction', null, 'Size removed from the product');
      end if;
      update public.product_variants set is_hidden = true, in_sample_pool = false where id = old_variant.id;
    else
      delete from public.product_variants where id = old_variant.id;
    end if;
  end loop;

  pos := 0;
  for v in select * from jsonb_array_elements(coalesce(payload -> 'variants', '[]'::jsonb)) loop
    vid := nullif(v ->> 'id', '')::uuid;
    begin
      if vid is not null and vid = any (keep_ids) then
        update public.product_variants set
          kind = coalesce(v ->> 'kind', 'retail'),
          sku = upper(trim(v ->> 'sku')),
          size_ml = nullif(v ->> 'size_ml', '')::numeric,
          concentration_option_id = nullif(v ->> 'concentration_option_id', '')::uuid,
          label = trim(v ->> 'label'),
          price = nullif(v ->> 'price', '')::numeric,
          compare_at_price = nullif(v ->> 'compare_at_price', '')::numeric,
          weight_g = nullif(v ->> 'weight_g', '')::int,
          length_mm = nullif(v ->> 'length_mm', '')::int,
          width_mm = nullif(v ->> 'width_mm', '')::int,
          height_mm = nullif(v ->> 'height_mm', '')::int,
          is_active = coalesce((v ->> 'is_active')::boolean, true),
          is_hidden = coalesce((v ->> 'is_hidden')::boolean, false),
          in_sample_pool = coalesce((v ->> 'in_sample_pool')::boolean, false),
          position = pos
        where id = vid;
      else
        insert into public.product_variants (
          product_id, kind, sku, size_ml, concentration_option_id, label, price, compare_at_price,
          weight_g, length_mm, width_mm, height_mm, is_active, is_hidden, in_sample_pool, position)
        values (
          pid, coalesce(v ->> 'kind', 'retail'), upper(trim(v ->> 'sku')), nullif(v ->> 'size_ml', '')::numeric,
          nullif(v ->> 'concentration_option_id', '')::uuid, trim(v ->> 'label'), nullif(v ->> 'price', '')::numeric,
          nullif(v ->> 'compare_at_price', '')::numeric, nullif(v ->> 'weight_g', '')::int, nullif(v ->> 'length_mm', '')::int,
          nullif(v ->> 'width_mm', '')::int, nullif(v ->> 'height_mm', '')::int, coalesce((v ->> 'is_active')::boolean, true),
          coalesce((v ->> 'is_hidden')::boolean, false), coalesce((v ->> 'in_sample_pool')::boolean, false), pos)
        returning id into vid;
        initial := coalesce(nullif(v ->> 'initial_stock', '')::int, 0);
        if initial > 0 then
          perform app_private.apply_stock_change(vid, initial, 'initial', null, 'Opening stock');
        end if;
      end if;
    exception when unique_violation then
      raise exception 'SKU_TAKEN: SKU % is already used by another size.', upper(trim(v ->> 'sku'));
    end;
    pos := pos + 1;
  end loop;

  -- media (replace, keep order; variant by id or sku)
  delete from public.product_media where product_id = pid;
  pos := 0;
  for m in select * from jsonb_array_elements(coalesce(payload -> 'media', '[]'::jsonb)) loop
    insert into public.product_media (product_id, variant_id, kind, url, alt, position)
    values (
      pid,
      coalesce(
        (select id from public.product_variants where product_id = pid and id = nullif(m ->> 'variant_id', '')::uuid),
        (select id from public.product_variants where product_id = pid and sku = upper(trim(m ->> 'variant_sku')))),
      coalesce(m ->> 'kind', 'image'), m ->> 'url', nullif(m ->> 'alt', ''), pos);
    pos := pos + 1;
  end loop;

  -- extra categories
  delete from public.product_categories where product_id = pid;
  insert into public.product_categories (product_id, category_id)
    select pid, x::uuid from jsonb_array_elements_text(coalesce(payload -> 'category_ids', '[]'::jsonb)) x
    on conflict do nothing;

  -- collections: keep the order set on the collection page; new memberships go last
  delete from public.product_collections
    where product_id = pid
      and not (collection_id::text in (select jsonb_array_elements_text(coalesce(payload -> 'collection_ids', '[]'::jsonb))));
  for cid in select x::uuid from jsonb_array_elements_text(coalesce(payload -> 'collection_ids', '[]'::jsonb)) x loop
    insert into public.product_collections (product_id, collection_id, position)
      values (pid, cid, coalesce((select max(position) + 1 from public.product_collections where collection_id = cid), 0))
      on conflict do nothing;
  end loop;

  -- notes
  delete from public.product_notes where product_id = pid;
  insert into public.product_notes (product_id, note_id, tier, position)
    select pid, (n ->> 'note_id')::uuid, n ->> 'tier', coalesce(nullif(n ->> 'position', '')::int, ord::int)
    from jsonb_array_elements(coalesce(payload -> 'notes', '[]'::jsonb)) with ordinality as t(n, ord)
    on conflict (product_id, note_id) do nothing;

  -- scent profile
  delete from public.product_attributes where product_id = pid;
  insert into public.product_attributes (product_id, option_id, strength, is_primary)
    select pid, (a ->> 'option_id')::uuid, nullif(a ->> 'strength', '')::int, coalesce((a ->> 'is_primary')::boolean, false)
    from jsonb_array_elements(coalesce(payload -> 'attributes', '[]'::jsonb)) a
    on conflict (product_id, option_id) do nothing;

  -- New perfume: the liquid it starts with (any unit was converted to ml by the editor).
  if is_new and coalesce(nullif(payload ->> 'liquid_ml', '')::numeric, 0) > 0
     and (select stock_unit from public.products where id = pid) = 'ml' then
    perform app_private.apply_liquid_change(pid, (payload ->> 'liquid_ml')::numeric, 'initial', null, 'Opening stock', null, 0);
  end if;
  perform app_private.refresh_product_derived(pid);
  perform app_private.refresh_product_search(pid);
  return pid;
end $$;
