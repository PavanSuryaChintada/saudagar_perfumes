-- The product page and category pages are CMS pages; their banner and grid can't be removed; each product can
-- hand-pick its "You may also appreciate" products, in order, and falls back to automatic ones without picks.

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000038a1', 'cms-admin@test.local', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000038a1', 'admin');

do $$ begin
  assert exists (select 1 from public.pages where slug = 'product-page' and is_system), 'product page template exists';
  assert (select count(*) from public.website_sections s join public.pages p on p.id = s.page_id where p.slug = 'product-page') >= 4, 'with its sections';
  assert exists (select 1 from public.website_sections s join public.pages p on p.id = s.page_id where p.slug = 'listing-page' and s.section_type = 'listing_grid'), 'category pages have their grid';
end $$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000038a1","role":"authenticated"}', true);
do $$
declare a uuid; b uuid; c uuid; cat uuid := (select id from public.categories order by created_at limit 1); grid uuid;
begin
  select s.id into grid from public.website_sections s join public.pages p on p.id = s.page_id where p.slug = 'listing-page' and s.section_type = 'listing_grid';
  begin
    delete from public.website_sections where id = grid;
    raise exception 'TEST_FAIL: grid deleted';
  exception when others then
    if sqlerrm not like 'SECTION_REQUIRED%' then raise; end if;
  end;
  begin
    update public.website_sections set is_visible = false where id = grid;
    raise exception 'TEST_FAIL: grid hidden';
  exception when others then
    if sqlerrm not like 'SECTION_REQUIRED%' then raise; end if;
  end;
  update public.website_sections set position = 5 where id = grid;  -- moving is fine

  a := public.save_product(jsonb_build_object('slug', 'tst-rel-a', 'name', 'Rel A', 'base_price', 100, 'is_active', true, 'primary_category_id', cat,
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-REL-A', 'kind', 'retail', 'size_ml', 30, 'label', '30 ml'))));
  b := public.save_product(jsonb_build_object('slug', 'tst-rel-b', 'name', 'Rel B', 'base_price', 100, 'is_active', true, 'primary_category_id', cat,
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-REL-B', 'kind', 'retail', 'size_ml', 30, 'label', '30 ml'))));
  c := public.save_product(jsonb_build_object('slug', 'tst-rel-c', 'name', 'Rel C', 'base_price', 100, 'is_active', true, 'primary_category_id', cat,
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-REL-C', 'kind', 'retail', 'size_ml', 30, 'label', '30 ml'))));
  assert jsonb_array_length(public.similar_products('tst-rel-a', 4)) > 0, 'automatic without picks';

  perform public.save_product(jsonb_build_object('id', a, 'slug', 'tst-rel-a', 'name', 'Rel A', 'base_price', 100, 'is_active', true, 'primary_category_id', cat,
    'related_product_ids', jsonb_build_array(c, b, a),
    'variants', jsonb_build_array(jsonb_build_object('id', (select id from public.product_variants where sku = 'TST-REL-A'), 'sku', 'TST-REL-A', 'kind', 'retail', 'size_ml', 30, 'label', '30 ml'))));
  assert (select related_product_ids from public.products where id = a) = array[c, b], 'picks saved in order, never itself';
  assert (select array_agg(x ->> 'slug') from jsonb_array_elements(public.similar_products('tst-rel-a', 4)) x) = array['tst-rel-c', 'tst-rel-b'], 'picked products shown in order';

  -- Saving without the field keeps the picks.
  perform public.save_product(jsonb_build_object('id', a, 'slug', 'tst-rel-a', 'name', 'Rel A2', 'base_price', 100, 'is_active', true, 'primary_category_id', cat,
    'variants', jsonb_build_array(jsonb_build_object('id', (select id from public.product_variants where sku = 'TST-REL-A'), 'sku', 'TST-REL-A', 'kind', 'retail', 'size_ml', 30, 'label', '30 ml'))));
  assert cardinality((select related_product_ids from public.products where id = a)) = 2, 'picks kept';
end $$;
