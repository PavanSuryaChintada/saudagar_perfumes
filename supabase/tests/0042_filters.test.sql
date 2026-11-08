-- Runs as a shopper (anon): the shop's search must work without any admin rights.
set local role anon;
do $$
declare r jsonb; cat text := (select slug from public.categories where is_active order by created_at limit 1);
begin
  r := public.search_products(jsonb_build_object('on_sale', true, 'page_size', 48));
  assert (r ->> 'total')::int = (r -> 'facets' ->> 'on_sale')::int, 'on sale filter matches its count';
  r := public.search_products(jsonb_build_object('categories', jsonb_build_array(cat), 'page_size', 48));
  assert (r ->> 'total')::int <= (select count(*) from public.products where is_active and archived_at is null), 'category filter narrows';
  assert (public.search_products('{}'::jsonb) -> 'facets' -> 'categories') is not null, 'category counts are returned';
  assert (public.search_products('{}'::jsonb) -> 'facets' -> 'notes') is not null, 'note counts are returned';
  r := public.search_products(jsonb_build_object('new', true));
  assert (r ->> 'total')::int = (r -> 'facets' ->> 'new')::int, 'new arrivals filter matches its count';
  r := public.search_products(jsonb_build_object('collections', jsonb_build_array('no-such-collection')));
  assert (r ->> 'total')::int = 0, 'an unknown collection finds nothing';
end $$;
