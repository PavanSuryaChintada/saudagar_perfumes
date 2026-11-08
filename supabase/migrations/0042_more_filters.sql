-- 0042_more_filters: the shop's filters also cover several categories or collections at once, products on sale and
-- new arrivals (added in the last catalog.new_days days, or badged New), with a count next to each choice.

insert into public.settings (key, value, is_public, description) values
  ('catalog.new_days', '60', true, 'Products added in this many days count as new arrivals')
on conflict (key) do nothing;

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
  -- Shop filters: several categories / collections at once, on sale, new arrivals.
  categories_f text[] := public.jsonb_text_array(p -> 'categories');
  collections_f text[] := public.jsonb_text_array(p -> 'collections');
  on_sale boolean := coalesce((p ->> 'on_sale')::boolean, false);
  new_only boolean := coalesce((p ->> 'new')::boolean, false);
  new_days int := greatest(1, coalesce((select nullif(value #>> '{}', '')::int from public.settings where key = 'catalog.new_days'), 60));
  cats_any uuid[];
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
  if coalesce(cardinality(categories_f), 0) > 0 then
    select array_agg(distinct x) into cats_any from unnest(categories_f) s, unnest(public.category_with_children(s)) x;
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
      and (cats_any is null or b.primary_category_id = any (cats_any)
           or exists (select 1 from public.product_categories pc where pc.product_id = b.id and pc.category_id = any (cats_any)))
      and (collections_f is null or cardinality(collections_f) = 0
           or exists (select 1 from public.product_collections pc join public.collections c on c.id = pc.collection_id
                      where pc.product_id = b.id and c.slug = any (collections_f)))
      and (not on_sale or exists (
            select 1 from public.product_variants v
            where v.product_id = b.id and v.kind = 'retail' and v.is_active and not v.is_hidden
              and coalesce(v.compare_at_price, b.compare_at_price) > coalesce(v.price, b.base_price)))
      and (not new_only or b.created_at > now() - make_interval(days => new_days) or lower(coalesce(b.badge, '')) like '%new%')
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
      'notes', coalesce((
        select jsonb_object_agg(slug, cnt) from (
          select n.slug, count(distinct b.id) as cnt from base b
          join public.product_notes pn on pn.product_id = b.id
          join public.notes n on n.id = pn.note_id
          group by n.slug) x), '{}'::jsonb),
      'categories', coalesce((
        select jsonb_object_agg(slug, cnt) from (
          select c.slug, count(distinct b.id) as cnt from base b
          join public.categories c on c.is_active and (c.id = b.primary_category_id
            or exists (select 1 from public.product_categories pc where pc.product_id = b.id and pc.category_id = c.id))
          group by c.slug) x), '{}'::jsonb),
      'collections', coalesce((
        select jsonb_object_agg(slug, cnt) from (
          select c.slug, count(distinct b.id) as cnt from base b
          join public.product_collections pc on pc.product_id = b.id
          join public.collections c on c.id = pc.collection_id and c.is_active
          group by c.slug) x), '{}'::jsonb),
      'on_sale', (select count(*) from base b where exists (
            select 1 from public.product_variants v
            where v.product_id = b.id and v.kind = 'retail' and v.is_active and not v.is_hidden
              and coalesce(v.compare_at_price, b.compare_at_price) > coalesce(v.price, b.base_price))),
      'new', (select count(*) from base b where b.created_at > now() - make_interval(days => new_days) or lower(coalesce(b.badge, '')) like '%new%'),
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
