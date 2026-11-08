-- Courier per order: only an admin can change it, only before booking, and never to a courier that can't collect
-- cash for an unpaid COD order. Packed orders are booked only with their own connected courier.

update public.settings set value = 'true' where key = 'cod.enabled';
update public.settings set value = '0' where key in ('shipping.free_threshold', 'cod.max_order', 'cod.max_open_orders');
update public.settings set value = 'false' where key = 'welcome.enabled';
update public.settings set value = '"other"' where key = 'shipping.default_courier';

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000040a1', 'int-admin@test.local', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000040c1', 'int-cust@test.local', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000040a1', 'admin');
insert into public.addresses (id, user_id, full_name, phone, line1, city, state, pincode) values
  ('00000000-0000-0000-0000-00000040ad01', '00000000-0000-0000-0000-0000000040c1', 'Int Buyer', '9800040001', '1 Post Lane', 'Guntur', 'Andhra Pradesh', '522001');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000040a1","role":"authenticated"}', true);
do $$
declare pid uuid;
begin
  pid := public.save_product(jsonb_build_object('slug', 'tst-int-oud', 'name', 'Int Oud', 'base_price', 1000, 'is_active', true, 'stock_unit', 'piece',
    'primary_category_id', (select id from public.categories order by created_at limit 1),
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-INT-50', 'kind', 'retail', 'size_ml', 50, 'label', '50 ml', 'initial_stock', 5))));
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000040c1","role":"authenticated"}', true);
create temp table t_o on commit drop as
  select (public.create_order('00000000-0000-0000-0000-00000040ad01',
    jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'TST-INT-50'), 'qty', 1)), null, 'COD') ->> 'id')::uuid as id;
grant select on t_o to public;
do $$ begin
  begin
    perform public.set_order_courier((select id from t_o), 'delhivery');
    raise exception 'TEST_FAIL: customer changed the courier';
  exception when others then
    if sqlerrm not like 'NOT_ADMIN%' then raise; end if;
  end;
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000040a1","role":"authenticated"}', true);
do $$
declare oid uuid := (select id from t_o); r jsonb;
begin
  assert (select courier from public.orders where id = oid) = 'other', 'new orders get the default courier';
  perform public.set_order_courier(oid, 'delhivery');
  assert (select courier from public.orders where id = oid) = 'delhivery', 'admin picks Delhivery';
  begin
    perform public.set_order_courier(oid, 'india_post');
    raise exception 'TEST_FAIL: India Post for unpaid COD';
  exception when others then
    if sqlerrm not like 'COURIER_NO_COD%' then raise; end if;
  end;
  begin
    perform public.set_order_courier(oid, 'pigeon');
    raise exception 'TEST_FAIL: unknown courier';
  exception when others then
    if sqlerrm not like 'COURIER_UNKNOWN%' then raise; end if;
  end;
  r := public.integration_readiness();
  assert r ? 'hook_secret' and r ? 'meta_pixel_id' and not (r::text ilike '%secret_value%'), 'readiness lists what is set, never secrets';
end $$;

reset role;
do $$ begin
  assert app_private.courier_automatic('other') = false, 'manual couriers are never booked automatically';
  assert app_private.courier_automatic('delhivery') = app_private.setting_bool('delhivery.enabled', false), 'Delhivery books only when switched on';
end $$;

-- A booked parcel keeps its order's courier.
do $$
declare oid uuid := (select id from t_o);
begin
  perform set_config('app.order_write', 'on', true);
  update public.orders set courier = 'india_post', payment_status = 'PAID' where id = oid;
  perform set_config('app.order_write', 'off', true);
  perform public.save_shipment_booking(oid, 'EI123456789IN', 'ref-1', null, null, null);
  assert (select courier from public.orders where id = oid) = 'india_post', 'booking keeps India Post';
  assert (select tracking_number from public.orders where id = oid) = 'EI123456789IN', 'and saves the article number';
end $$;
