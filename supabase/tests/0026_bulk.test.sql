-- Bulk actions skip bad rows and report them; sheets update price and log stock changes; dashboard data loads.

update public.settings set value = 'true' where key in ('cod.enabled', 'payments.online_enabled');
update public.settings set value = 'false' where key in ('welcome.enabled', 'samples.enabled');
update public.settings set value = '0' where key in ('shipping.free_threshold', 'cod.max_order', 'cod.max_open_orders');

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000026a1', 'bulk-admin@test.local', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000026c1', 'bulk-cust@test.local', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000026a1', 'admin');
insert into public.addresses (id, user_id, full_name, phone, line1, city, state, pincode) values
  ('00000000-0000-0000-0000-00000026ad01', '00000000-0000-0000-0000-0000000026c1', 'Bulk Buyer', '9800026001', '1 Bulk Road', 'Guntur', 'Andhra Pradesh', '522001');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000026a1","role":"authenticated"}', true);
create temp table t_ids (k text primary key, id uuid) on commit drop;
grant all on t_ids to public;
do $$
declare cat uuid := (select id from public.categories order by created_at limit 1); extra uuid;
begin
  insert into t_ids values ('a', public.save_product(jsonb_build_object('slug', 'tst-bulk-a', 'name', 'Bulk A', 'base_price', 1000, 'is_active', true, 'stock_unit', 'piece', 'primary_category_id', cat,
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-BULK-A50', 'kind', 'retail', 'size_ml', 50, 'label', '50 ml', 'initial_stock', 10)))));
  insert into t_ids values ('b', public.save_product(jsonb_build_object('slug', 'tst-bulk-b', 'name', 'Bulk B', 'base_price', 2000, 'is_active', true, 'stock_unit', 'piece', 'primary_category_id', cat,
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-BULK-B50', 'kind', 'retail', 'size_ml', 50, 'label', '50 ml', 'initial_stock', 4)))));
  insert into public.categories (slug, name) values ('tst-bulk-gifts', 'Bulk Gifts') returning id into extra;
  insert into t_ids values ('cat', extra);
end $$;

-- Sizes from a sheet: price set, price cleared, stock to a new count (logged), unknown SKU reported.
do $$
declare res jsonb;
begin
  res := public.bulk_update_variants(jsonb_build_array(
    jsonb_build_object('sku', 'tst-bulk-a50', 'price', 1200, 'stock', 25),
    jsonb_build_object('sku', 'TST-BULK-B50', 'price', null, 'compare_at_price', 2500),
    jsonb_build_object('sku', 'NOPE-123', 'stock', 5),
    jsonb_build_object('sku', 'TST-BULK-B50', 'stock', -1)));
  assert (res ->> 'updated')::int = 2, 'two rows updated';
  assert jsonb_array_length(res -> 'errors') = 2, 'unknown SKU and negative stock are reported';
  assert (select price from public.product_variants where sku = 'TST-BULK-A50') = 1200, 'price set';
  assert (select stock from public.product_variants where sku = 'TST-BULK-A50') = 25, 'stock set to the new count';
  assert exists (select 1 from public.inventory_movements m join public.product_variants v on v.id = m.variant_id
                 where v.sku = 'TST-BULK-A50' and m.delta = 15 and m.reason = 'correction'), 'the stock change is logged';
  assert (select price from public.product_variants where sku = 'TST-BULK-B50') is null, 'an empty price means the base price';
  assert (select stock from public.product_variants where sku = 'TST-BULK-B50') = 4, 'a refused row changes nothing';
end $$;

-- Products: hide, show, add to a category, set a badge.
do $$
declare ids uuid[] := array[(select id from t_ids where k = 'a'), (select id from t_ids where k = 'b')];
begin
  assert public.bulk_product_action(ids, 'deactivate') = 2, 'two hidden';
  assert not exists (select 1 from public.products where id = any (ids) and is_active), 'both hidden';
  perform public.bulk_product_action(ids, 'activate');
  assert public.bulk_product_action(ids, 'add_category', (select id from t_ids where k = 'cat')::text) = 2, 'added to a category';
  assert public.bulk_product_action(ids, 'add_category', (select id from t_ids where k = 'cat')::text) = 0, 'adding twice changes nothing';
  perform public.bulk_product_action(ids, 'set_badge', 'New');
  assert (select count(*) from public.products where id = any (ids) and badge = 'New') = 2, 'badge set';
end $$;

-- Orders: two COD orders and one unpaid online order; packing all three packs the COD ones and explains the other.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000026c1","role":"authenticated"}', true);
create temp table t_orders on commit drop as
  select (public.create_order('00000000-0000-0000-0000-00000026ad01', jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'TST-BULK-A50'), 'qty', 1)), null, 'COD') ->> 'id')::uuid as id
  union all
  select (public.create_order('00000000-0000-0000-0000-00000026ad01', jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'TST-BULK-A50'), 'qty', 1)), null, 'COD') ->> 'id')::uuid
  union all
  select (public.create_order('00000000-0000-0000-0000-00000026ad01', jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'TST-BULK-A50'), 'qty', 1)), null, 'ONLINE') ->> 'id')::uuid;
grant select on t_orders to public;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000026a1","role":"authenticated"}', true);
do $$
declare res jsonb; ids uuid[] := (select array_agg(id) from t_orders);
begin
  res := public.bulk_order_status(ids, 'PACKED');
  assert (res ->> 'done')::int = 2, 'the two COD orders are packed';
  assert jsonb_array_length(res -> 'skipped') = 1, 'the unpaid online order is skipped';
  assert (res -> 'skipped' -> 0 ->> 'message') not like '%:%' or (res -> 'skipped' -> 0 ->> 'message') !~ '^[A-Z_]+:', 'the reason is a plain sentence';

  res := public.bulk_ship_orders((select jsonb_agg(jsonb_build_object('order_id', o.id, 'courier', 'other', 'tracking', 'TRK' || left(o.id::text, 6)))
                                  from public.orders o where o.id = any (ids) and o.status = 'PACKED'));
  assert (res ->> 'done')::int = 2, 'both packed orders shipped';

  res := public.admin_insights(30);
  assert res ? 'today' and res ? 'pipeline' and res ? 'payments' and res ? 'stock', 'dashboard data has every view';
  assert (res -> 'payments' -> 'cod_to_collect' ->> 'orders')::int >= 2, 'shipped COD orders are cash still to collect';
  assert jsonb_array_length(res -> 'pipeline' -> 'steps') = 5, 'pipeline has five steps';
end $$;

-- Customers can't run bulk actions.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000026c1","role":"authenticated"}', true);
do $$ begin
  begin
    perform public.bulk_product_action(array[(select id from t_ids where k = 'a')], 'deactivate');
    raise exception 'TEST_FAIL: a customer ran a bulk action';
  exception when others then
    if sqlerrm not like 'NOT_ADMIN%' then raise; end if;
  end;
end $$;
