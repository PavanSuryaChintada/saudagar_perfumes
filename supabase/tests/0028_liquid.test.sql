-- Liquid stock: sizes come from the ml left, orders and samples take their ml, the history tells them apart,
-- a size is sold out once less is left than it holds, units convert, and stock can't be written directly.

update public.settings set value = 'true' where key = 'cod.enabled';
update public.settings set value = '0' where key in ('shipping.free_threshold', 'cod.max_order', 'cod.max_open_orders');
update public.settings set value = 'false' where key = 'welcome.enabled';

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000028a1', 'liquid-admin@test.local', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000028c1', 'liquid-cust@test.local', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000028a1', 'admin');
insert into public.addresses (id, user_id, full_name, phone, line1, city, state, pincode) values
  ('00000000-0000-0000-0000-00000028ad01', '00000000-0000-0000-0000-0000000028c1', 'Liquid Buyer', '9800028001', '1 Oud Lane', 'Guntur', 'Andhra Pradesh', '522001');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000028a1","role":"authenticated"}', true);
create temp table t_liq (k text primary key, id uuid) on commit drop;
grant all on t_liq to public;
do $$
declare pid uuid;
begin
  pid := public.save_product(jsonb_build_object('slug', 'tst-liquid-oud', 'name', 'Liquid Oud', 'base_price', 3000, 'is_active', true,
    'primary_category_id', (select id from public.categories order by created_at limit 1),
    'variants', jsonb_build_array(
      jsonb_build_object('sku', 'TST-LIQ-50', 'kind', 'retail', 'size_ml', 50, 'label', '50 ml'),
      jsonb_build_object('sku', 'TST-LIQ-100', 'kind', 'retail', 'size_ml', 100, 'label', '100 ml', 'price', 5000))));
  insert into t_liq values ('p', pid);
  insert into t_liq values ('sample', public.create_sample_variant(pid, 5, 0));
  assert (select stock_unit from public.products where id = pid) = 'ml', 'perfumes are kept in ml';

  perform public.adjust_liquid(pid, 'set', 1, 'L', null, 'Opening stock');
  assert (select stock_ml from public.products where id = pid) = 1000, '1 L is 1000 ml';
  assert (select stock from public.product_variants where sku = 'TST-LIQ-50') = 20, '20 bottles of 50 ml fit in 1 L';
  assert (select stock from public.product_variants where sku = 'TST-LIQ-100') = 10, '10 bottles of 100 ml';
  assert (select stock from public.product_variants where id = (select id from t_liq where k = 'sample')) = 200, '200 samples of 5 ml';

  perform public.adjust_liquid(pid, 'add', 1, 'tola', null, null);
  assert (select stock_ml from public.products where id = pid) = 1011.66, '1 tola is 11.66 ml';
  perform public.adjust_liquid(pid, 'set', 1000, 'ml', null, null);

  begin
    update public.products set stock_ml = 5 where id = pid;
    raise exception 'TEST_FAIL: liquid written directly';
  exception when others then
    if sqlerrm not like 'STOCK_DIRECT_WRITE%' then raise; end if;
  end;
end $$;

-- A customer buys two 100 ml bottles; a free sample is taken from the same liquid.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000028c1","role":"authenticated"}', true);
create temp table t_ord on commit drop as
  select (public.create_order('00000000-0000-0000-0000-00000028ad01',
    jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'TST-LIQ-100'), 'qty', 2)), null, 'COD') ->> 'id')::uuid as id;
grant select on t_ord to public;
reset role;
do $$
declare pid uuid := (select id from t_liq where k = 'p');
begin
  assert (select stock_ml from public.products where id = pid) = 800, 'two 100 ml bottles took 200 ml';
  assert (select stock from public.product_variants where sku = 'TST-LIQ-50') = 16, 'the 50 ml size follows the liquid';
  perform app_private.apply_stock_change((select id from t_liq where k = 'sample'), -1, 'order', (select id from t_ord), 'Free sample');
  assert (select stock_ml from public.products where id = pid) = 795, 'a free sample took 5 ml';
end $$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000028a1","role":"authenticated"}', true);
do $$
declare pid uuid := (select id from t_liq where k = 'p'); h jsonb;
begin
  h := public.product_stock_history(pid, 50);
  assert (h -> 'totals' ->> 'orders_ml')::numeric = 200, 'history: 200 ml went to orders';
  assert (h -> 'totals' ->> 'samples_ml')::numeric = 5, 'history: 5 ml went to samples';
  assert (h -> 'totals' ->> 'orders_units')::int = 2 and (h -> 'totals' ->> 'samples_units')::int = 1, 'and how many of each';
  assert jsonb_array_length(h -> 'rows') >= 4, 'every change is listed';

  -- Cancelling gives the liquid back.
  perform public.cancel_order((select id from t_ord), 'test');
  assert (select stock_ml from public.products where id = pid) = 995, 'cancelling put the 200 ml back (the sample stays used)';

  -- Less left than a size: that size is sold out, smaller ones still sell.
  perform public.adjust_liquid(pid, 'set', 40, 'ml', null, null);
  assert (select stock from public.product_variants where sku = 'TST-LIQ-50') = 0, '50 ml is sold out with 40 ml left';
  assert (select stock from public.product_variants where id = (select id from t_liq where k = 'sample')) = 8, 'samples still available';
  assert (public.quote_order(jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'TST-LIQ-50'), 'qty', 1))) -> 'problems' -> 0 ->> 'reason') = 'OUT_OF_STOCK',
    'the shop refuses the 50 ml';

  -- Two sizes in one bag share the liquid.
  perform public.adjust_liquid(pid, 'set', 120, 'ml', null, null);
  assert (public.quote_order(jsonb_build_array(
            jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'TST-LIQ-100'), 'qty', 1),
            jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'TST-LIQ-50'), 'qty', 1))) -> 'problems' -> 0 ->> 'message') like 'Only 120 ml of Liquid Oud is left%',
    'a bag needing 150 ml of a perfume with 120 ml left is refused with the reason';

  -- Pieces: switching keeps counts per size, and liquid can't be adjusted.
  perform public.set_stock_mode(pid, 'piece');
  begin
    perform public.adjust_liquid(pid, 'add', 10, 'ml', null, null);
    raise exception 'TEST_FAIL: liquid added to a piece product';
  exception when others then
    if sqlerrm not like 'STOCK_UNIT%' then raise; end if;
  end;
end $$;
