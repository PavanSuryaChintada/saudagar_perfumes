-- 0029_save_product_stock_unit: a new product says how its stock is kept (ml of liquid or pieces) and, for perfumes,
-- the liquid it starts with. Existing products change mode through set_stock_mode.
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
      admin_note = nullif(payload ->> 'admin_note', '')
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

  for old_variant in select id, stock, units_sold from public.product_variants where product_id = pid and not (id = any (keep_ids)) loop
    if old_variant.units_sold > 0 then
      if old_variant.stock > 0 then
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
