-- 0005 Catalog read RPCs: product cards, detail, search with filters + facets, suggest, similar, filters, resolvers.
-- All are security invoker: row-level security decides what each visitor sees.

-- ------------------------------------------------------------ product card (listing shape)
create or replace function public.product_card(pid uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'id', p.id,
    'slug', p.slug,
    'name', p.name,
    'short_description', p.short_description,
    'badge', p.badge,
    'base_price', p.base_price,
    'min_price', coalesce(p.min_price, p.base_price),
    'max_price', coalesce(p.max_price, p.base_price),
    'compare_at', (
      select coalesce(v.compare_at_price, p.compare_at_price)
      from public.product_variants v
      where v.product_id = p.id and v.kind = 'retail' and v.is_active and not v.is_hidden
      order by coalesce(v.price, p.base_price), v.position limit 1),
    'images', coalesce((
      select jsonb_agg(m.url order by m.position)
      from (select url, position from public.product_media where product_id = p.id and kind = 'image' order by position limit 3) m), '[]'::jsonb),
    'video', (select url from public.product_media where product_id = p.id and kind = 'video' order by position limit 1),
    'sizes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'variant_id', v.id, 'sku', v.sku, 'ml', v.size_ml, 'label', v.label,
        'price', coalesce(v.price, p.base_price), 'compare_at', coalesce(v.compare_at_price, p.compare_at_price),
        'stock', v.stock) order by v.position)
      from public.product_variants v
      where v.product_id = p.id and v.kind = 'retail' and v.is_active and not v.is_hidden), '[]'::jsonb),
    'notes', jsonb_build_object(
      'top', coalesce((select jsonb_agg(n.name order by pn.position) from public.product_notes pn join public.notes n on n.id = pn.note_id where pn.product_id = p.id and pn.tier = 'top'), '[]'::jsonb),
      'heart', coalesce((select jsonb_agg(n.name order by pn.position) from public.product_notes pn join public.notes n on n.id = pn.note_id where pn.product_id = p.id and pn.tier = 'heart'), '[]'::jsonb),
      'base', coalesce((select jsonb_agg(n.name order by pn.position) from public.product_notes pn join public.notes n on n.id = pn.note_id where pn.product_id = p.id and pn.tier = 'base'), '[]'::jsonb)),
    'concentration', (
      select o.label from public.product_attributes pa join public.attribute_options o on o.id = pa.option_id
      where pa.product_id = p.id and o.kind = 'concentration' order by pa.is_primary desc, o.position limit 1),
    'concentration_note', p.concentration_note,
    'family', (
      select o.label from public.product_attributes pa join public.attribute_options o on o.id = pa.option_id
      where pa.product_id = p.id and o.kind = 'family' order by pa.is_primary desc, o.position limit 1),
    'category', (select c.name from public.categories c where c.id = p.primary_category_id),
    'category_slug', (select c.slug from public.categories c where c.id = p.primary_category_id),
    'collections', coalesce((
      select jsonb_agg(jsonb_build_object('slug', c.slug, 'name', c.name) order by c.position)
      from public.product_collections pc join public.collections c on c.id = pc.collection_id where pc.product_id = p.id), '[]'::jsonb),
    'rating_avg', p.rating_avg,
    'rating_count', p.rating_count,
    'total_stock', p.total_stock,
    'is_featured', p.is_featured,
    'counts_toward_samples', p.counts_toward_samples,
    'created_at', p.created_at)
  from public.products p
  where p.id = pid;
$$;
grant execute on function public.product_card(uuid) to anon, authenticated;

-- ------------------------------------------------------------ product detail (product page shape)
create or replace function public.product_detail(p_slug text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select public.product_card(p.id) || jsonb_build_object(
    'description', p.description,
    'perfumer', p.perfumer,
    'launch_year', p.launch_year,
    'inspiration', p.inspiration,
    'how_to_wear', p.how_to_wear,
    'ships_surface_only', p.ships_surface_only,
    'seo_title', p.seo_title,
    'seo_description', p.seo_description,
    'compliance', jsonb_build_object(
      'country_of_origin', p.country_of_origin,
      'manufacturer_name', p.manufacturer_name, 'manufacturer_address', p.manufacturer_address,
      'packer_name', p.packer_name, 'packer_address', p.packer_address,
      'importer_name', p.importer_name, 'importer_address', p.importer_address,
      'consumer_care', p.consumer_care, 'shelf_life', p.shelf_life,
      'ingredients', p.ingredients, 'allergens', p.allergens, 'caution_text', p.caution_text,
      'hsn_code', p.hsn_code, 'gst_rate', p.gst_rate),
    'media', coalesce((
      select jsonb_agg(jsonb_build_object('kind', m.kind, 'url', m.url, 'alt', m.alt, 'variant_id', m.variant_id) order by m.position)
      from public.product_media m where m.product_id = p.id), '[]'::jsonb),
    'notes', jsonb_build_object(
      'top', coalesce((select jsonb_agg(jsonb_build_object('name', n.name, 'slug', n.slug, 'image', n.image_url, 'description', n.short_description) order by pn.position)
        from public.product_notes pn join public.notes n on n.id = pn.note_id where pn.product_id = p.id and pn.tier = 'top'), '[]'::jsonb),
      'heart', coalesce((select jsonb_agg(jsonb_build_object('name', n.name, 'slug', n.slug, 'image', n.image_url, 'description', n.short_description) order by pn.position)
        from public.product_notes pn join public.notes n on n.id = pn.note_id where pn.product_id = p.id and pn.tier = 'heart'), '[]'::jsonb),
      'base', coalesce((select jsonb_agg(jsonb_build_object('name', n.name, 'slug', n.slug, 'image', n.image_url, 'description', n.short_description) order by pn.position)
        from public.product_notes pn join public.notes n on n.id = pn.note_id where pn.product_id = p.id and pn.tier = 'base'), '[]'::jsonb)),
    'attributes', coalesce((
      select jsonb_object_agg(kind, items) from (
        select o.kind, jsonb_agg(jsonb_build_object(
          'label', o.label, 'slug', o.slug, 'description', o.description, 'badge', o.badge,
          'strength', pa.strength, 'is_primary', pa.is_primary)
          order by pa.is_primary desc, pa.strength desc nulls last, o.position) as items
        from public.product_attributes pa join public.attribute_options o on o.id = pa.option_id
        where pa.product_id = p.id
        group by o.kind) g), '{}'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('slug', c.slug, 'name', c.name))
      from public.categories c
      where c.id = p.primary_category_id or c.id in (select category_id from public.product_categories where product_id = p.id)), '[]'::jsonb))
  from public.products p
  where p.slug = p_slug and p.is_active and p.archived_at is null;
$$;
grant execute on function public.product_detail(text) to anon, authenticated;

-- ------------------------------------------------------------ helpers for filters
create or replace function public.category_with_children(p_slug text)
returns uuid[] language sql stable security invoker set search_path = '' as $$
  with recursive tree as (
    select id from public.categories where slug = p_slug
    union all
    select c.id from public.categories c join tree t on c.parent_id = t.id
  )
  select coalesce(array_agg(id), '{}') from tree;
$$;
grant execute on function public.category_with_children(text) to anon, authenticated;

create or replace function public.jsonb_text_array(j jsonb)
returns text[] language sql immutable set search_path = '' as $$
  select case when j is null or jsonb_typeof(j) <> 'array' then null
              else array(select jsonb_array_elements_text(j)) end;
$$;

-- ------------------------------------------------------------ search
-- p: {q, category, collection, note, notes[], note_families[], attrs{kind:[slug]}, price_min, price_max,
--     sizes[], in_stock, featured, slugs[], sort, page, page_size}
create or replace function public.search_products(p jsonb default '{}'::jsonb)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  q text := nullif(trim(coalesce(p ->> 'q', '')), '');
  tsq tsquery;
  cat_ids uuid[];
  col_id uuid;
  attrs jsonb := coalesce(p -> 'attrs', '{}'::jsonb);
  notes_f text[] := public.jsonb_text_array(p -> 'notes');
  families_f text[] := public.jsonb_text_array(p -> 'note_families');
  sizes_f numeric[] := (select array_agg(x::numeric) from jsonb_array_elements_text(coalesce(p -> 'sizes', '[]'::jsonb)) x);
  slugs_f text[] := public.jsonb_text_array(p -> 'slugs');
  price_min numeric := nullif(p ->> 'price_min', '')::numeric;
  price_max numeric := nullif(p ->> 'price_max', '')::numeric;
  in_stock boolean := coalesce((p ->> 'in_stock')::boolean, false);
  featured boolean := coalesce((p ->> 'featured')::boolean, false);
  sort text := coalesce(nullif(p ->> 'sort', ''), 'featured');
  page int := greatest(coalesce(nullif(p ->> 'page', '')::int, 1), 1);
  page_size int := least(greatest(coalesce(nullif(p ->> 'page_size', '')::int, 24), 1), 48);
  result jsonb;
begin
  if q is not null then
    select to_tsquery('simple', string_agg(quote_literal(w) || ':*', ' & '))
      into tsq
      from unnest(regexp_split_to_array(lower(extensions.unaccent('extensions.unaccent'::regdictionary, q)), '[^a-z0-9]+')) w
      where w <> '';
  end if;
  if nullif(p ->> 'category', '') is not null then cat_ids := public.category_with_children(p ->> 'category'); end if;
  if nullif(p ->> 'collection', '') is not null then
    select id into col_id from public.collections where slug = p ->> 'collection' or (p ->> 'collection') = any (aliases) limit 1;
  end if;

  with base as (
    select pr.* from public.products pr
    where pr.is_active and pr.archived_at is null
      and (q is null or (tsq is not null and pr.search_vector @@ tsq) or pr.search_text like '%' || lower(q) || '%')
      and (cat_ids is null or pr.primary_category_id = any (cat_ids)
           or exists (select 1 from public.product_categories pc where pc.product_id = pr.id and pc.category_id = any (cat_ids)))
      and (nullif(p ->> 'collection', '') is null
           or exists (select 1 from public.product_collections pc where pc.product_id = pr.id and pc.collection_id = col_id))
      and (nullif(p ->> 'note', '') is null
           or exists (select 1 from public.product_notes pn join public.notes n on n.id = pn.note_id where pn.product_id = pr.id and n.slug = p ->> 'note'))
      and (slugs_f is null or pr.slug = any (slugs_f))
  ),
  filtered as (
    select b.* from base b
    where (notes_f is null or cardinality(notes_f) = 0
           or exists (select 1 from public.product_notes pn join public.notes n on n.id = pn.note_id where pn.product_id = b.id and n.slug = any (notes_f)))
      and (families_f is null or cardinality(families_f) = 0
           or exists (select 1 from public.product_notes pn join public.notes n on n.id = pn.note_id
                      join public.attribute_options fo on fo.id = n.family_option_id
                      where pn.product_id = b.id and fo.slug = any (families_f)))
      and not exists (
        select 1 from jsonb_each(attrs) a(k, vals)
        where jsonb_typeof(vals) = 'array' and jsonb_array_length(vals) > 0
          and not exists (
            select 1 from public.product_attributes pa join public.attribute_options o on o.id = pa.option_id
            where pa.product_id = b.id and o.kind = a.k and o.slug in (select jsonb_array_elements_text(a.vals))))
      and (price_min is null or coalesce(b.min_price, b.base_price) >= price_min)
      and (price_max is null or coalesce(b.min_price, b.base_price) <= price_max)
      and (sizes_f is null or b.available_sizes && sizes_f)
      and (not in_stock or b.total_stock > 0)
      and (not featured or b.is_featured)
  ),
  ordered as (
    select f.id,
      row_number() over (order by
        case when sort = 'price_asc' then coalesce(f.min_price, f.base_price) end asc nulls last,
        case when sort = 'price_desc' then coalesce(f.min_price, f.base_price) end desc nulls last,
        case when sort = 'best_selling' then f.units_sold end desc nulls last,
        case when sort = 'newest' then f.created_at end desc nulls last,
        case when sort = 'featured' and col_id is not null then
          (select pc.position from public.product_collections pc where pc.product_id = f.id and pc.collection_id = col_id) end asc nulls last,
        case when sort = 'featured' then f.is_featured end desc,
        f.created_at asc, f.slug asc) as rn
    from filtered f
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(public.product_card(o.id) order by o.rn) from ordered o
                       where o.rn > (page - 1) * page_size and o.rn <= page * page_size), '[]'::jsonb),
    'total', (select count(*) from filtered),
    'page', page,
    'page_size', page_size,
    'facets', jsonb_build_object(
      'options', coalesce((
        select jsonb_object_agg(kind, counts) from (
          select o.kind, jsonb_object_agg(o.slug, cnt) as counts from (
            select o.kind, o.slug, count(distinct b.id) as cnt
            from base b
            join public.product_attributes pa on pa.product_id = b.id
            join public.attribute_options o on o.id = pa.option_id
            group by o.kind, o.slug) o
          group by o.kind) g), '{}'::jsonb),
      'note_family', coalesce((
        select jsonb_object_agg(slug, cnt) from (
          select fo.slug, count(distinct b.id) as cnt from base b
          join public.product_notes pn on pn.product_id = b.id
          join public.notes n on n.id = pn.note_id
          join public.attribute_options fo on fo.id = n.family_option_id
          group by fo.slug) x), '{}'::jsonb))
  ) into result;

  -- facets keyed by kind directly as well, for convenience: facets.<kind>.<slug>
  result := jsonb_set(result, '{facets}', (result -> 'facets') || coalesce(result -> 'facets' -> 'options', '{}'::jsonb));
  return result;
end $$;
grant execute on function public.search_products(jsonb) to anon, authenticated;

-- ------------------------------------------------------------ suggestions for the search box
create or replace function public.search_suggest(q text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with term as (select lower(trim(coalesce(q, ''))) as t)
  select case when (select length(t) from term) < 2 then
    jsonb_build_object('products', '[]'::jsonb, 'notes', '[]'::jsonb, 'collections', '[]'::jsonb)
  else jsonb_build_object(
    'products', coalesce((
      select jsonb_agg(x) from (
        select jsonb_build_object(
          'slug', p.slug, 'name', p.name, 'min_price', coalesce(p.min_price, p.base_price),
          'image', (select url from public.product_media m where m.product_id = p.id and m.kind = 'image' order by position limit 1)) as x
        from public.products p, term
        where p.is_active and p.archived_at is null and p.search_text like '%' || term.t || '%'
        order by (lower(p.name) like term.t || '%') desc, extensions.similarity(lower(p.name), term.t) desc, p.units_sold desc
        limit 6) s), '[]'::jsonb),
    'notes', coalesce((
      select jsonb_agg(x) from (
        select jsonb_build_object('slug', n.slug, 'name', n.name) as x
        from public.notes n, term
        where n.is_active and lower(n.name) like '%' || term.t || '%'
        order by (lower(n.name) like term.t || '%') desc, n.name
        limit 5) s), '[]'::jsonb),
    'collections', coalesce((
      select jsonb_agg(x) from (
        select jsonb_build_object('slug', c.slug, 'name', c.name) as x
        from public.collections c, term
        where c.is_active and lower(c.name) like '%' || term.t || '%'
        order by c.position
        limit 4) s), '[]'::jsonb))
  end;
$$;
grant execute on function public.search_suggest(text) to anon, authenticated;

-- ------------------------------------------------------------ similar scents
create or replace function public.similar_products(p_slug text, p_limit int default 4)
returns jsonb language sql stable security invoker set search_path = '' as $$
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
    where p.is_active and p.archived_at is null and p.id <> coalesce((select id from me), '00000000-0000-0000-0000-000000000000')
  )
  select coalesce(jsonb_agg(public.product_card(s.id) order by s.score desc, s.same_category desc, s.units_sold desc), '[]'::jsonb)
  from (select * from scored order by score desc, same_category desc, units_sold desc limit greatest(least(p_limit, 12), 1)) s
  where exists (select 1 from me);
$$;
grant execute on function public.similar_products(text, int) to anon, authenticated;

-- ------------------------------------------------------------ filter sidebar data
create or replace function public.catalog_filters()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'categories', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'slug', slug, 'name', name, 'parent_id', parent_id) order by position, name)
                            from public.categories where is_active), '[]'::jsonb),
    'collections', coalesce((select jsonb_agg(jsonb_build_object('slug', slug, 'name', name) order by position, name)
                             from public.collections where is_active), '[]'::jsonb),
    'notes', coalesce((select jsonb_agg(jsonb_build_object('slug', n.slug, 'name', n.name, 'image', n.image_url, 'family', fo.slug) order by n.position, n.name)
                       from public.notes n left join public.attribute_options fo on fo.id = n.family_option_id where n.is_active), '[]'::jsonb),
    'options', coalesce((
      select jsonb_object_agg(kind, items) from (
        select kind, jsonb_agg(jsonb_build_object('slug', slug, 'label', label, 'description', description, 'badge', badge) order by position, label) as items
        from public.attribute_options where is_active group by kind) g), '{}'::jsonb),
    'price', (select jsonb_build_object('min', min(coalesce(min_price, base_price)), 'max', max(coalesce(max_price, base_price)))
              from public.products where is_active and archived_at is null),
    'sizes', coalesce((select jsonb_agg(s order by s) from (
                select distinct unnest(available_sizes) as s from public.products where is_active and archived_at is null) x), '[]'::jsonb));
$$;
grant execute on function public.catalog_filters() to anon, authenticated;

-- ------------------------------------------------------------ resolvers for listing headers
create or replace function public.resolve_collection(p_slug text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select to_jsonb(c) - 'created_at' - 'updated_at'
  from public.collections c
  where c.is_active and (c.slug = p_slug or p_slug = any (c.aliases))
  order by (c.slug = p_slug) desc
  limit 1;
$$;
grant execute on function public.resolve_collection(text) to anon, authenticated;

create or replace function public.resolve_category(p_slug text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select to_jsonb(c) - 'created_at' - 'updated_at' || jsonb_build_object(
    'children', coalesce((select jsonb_agg(jsonb_build_object('slug', k.slug, 'name', k.name) order by k.position)
                          from public.categories k where k.parent_id = c.id and k.is_active), '[]'::jsonb))
  from public.categories c
  where c.is_active and c.slug = p_slug;
$$;
grant execute on function public.resolve_category(text) to anon, authenticated;

create or replace function public.resolve_note(p_slug text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('slug', n.slug, 'name', n.name, 'description', n.short_description, 'image', n.image_url,
                            'family', fo.label, 'family_slug', fo.slug)
  from public.notes n left join public.attribute_options fo on fo.id = n.family_option_id
  where n.is_active and n.slug = p_slug;
$$;
grant execute on function public.resolve_note(text) to anon, authenticated;
