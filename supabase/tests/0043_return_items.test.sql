-- Returns: each bought line can be asked back once, never more than was bought, so a return can't put extra
-- bottles back on the shelf (found by the scenario test: the same bottle listed twice was accepted and restocked twice).

update public.settings set value = 'true' where key = 'cod.enabled';
update public.settings set value = '7' where key = 'returns.window_days';

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000004a1', 'ri-admin@test.local', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000004a2', 'ri-cust@test.local', '{"full_name":"Return Items"}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000004a1', 'admin');
insert into public.addresses (id, user_id, full_name, phone, line1, city, state, pincode) values
  ('00000000-0000-0000-0000-00000004ad01', '00000000-0000-0000-0000-0000000004a2', 'Return Items', '9876543210', '1 Test Road', 'Pune', 'Maharashtra', '411001');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004a1","role":"authenticated"}', true);
do $$ begin
  perform public.save_product('{
    "slug": "tst-ri-oud", "name": "Return Items Oud", "base_price": 3000, "is_active": true,
    "variants": [{"sku": "TST-RI-50", "kind": "retail", "size_ml": 50, "label": "50 ml", "initial_stock": 5}]}'::jsonb);
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004a2","role":"authenticated"}', true);
do $$
declare r jsonb;
begin
  r := public.create_order('00000000-0000-0000-0000-00000004ad01',
    jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'TST-RI-50'), 'qty', 1)),
    null, 'COD', '[]'::jsonb, null, null);
  perform set_config('test.order', r ->> 'id', true);
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004a1","role":"authenticated"}', true);
do $$
declare o uuid := current_setting('test.order')::uuid;
begin
  perform public.set_order_status(o, 'PACKED', null);
  perform public.ship_order(o, 'manual', 'TST-RI-1', null);
  perform public.set_order_status(o, 'DELIVERED', null);
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004a2","role":"authenticated"}', true);
do $$
declare
  o uuid := current_setting('test.order')::uuid;
  li uuid := (select id from public.order_items where order_id = current_setting('test.order')::uuid and line_type = 'item');
  rid uuid;
begin
  begin
    perform public.request_return(o, 'DAMAGED', null,
      jsonb_build_array(jsonb_build_object('order_item_id', li, 'qty', 1), jsonb_build_object('order_item_id', li, 'qty', 1)), '[]'::jsonb);
    raise exception 'TEST_FAIL: the same bottle listed twice was accepted';
  exception when others then
    if sqlerrm not like 'RETURN_ITEMS%' then raise; end if;
  end;
  begin
    perform public.request_return(o, 'DAMAGED', null, jsonb_build_array(jsonb_build_object('order_item_id', li, 'qty', 1.5)), '[]'::jsonb);
    raise exception 'TEST_FAIL: a part bottle was accepted';
  exception when others then
    if sqlerrm not like 'RETURN_ITEMS%' then raise; end if;
  end;
  rid := public.request_return(o, 'LEAKING', 'Cap leaked', jsonb_build_array(jsonb_build_object('order_item_id', li, 'qty', 1)), '[]'::jsonb);
  assert rid is not null, 'one bottle can be returned';
  perform set_config('test.return', rid::text, true);
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000004a1","role":"authenticated"}', true);
do $$
declare
  v uuid := (select id from public.product_variants where sku = 'TST-RI-50');
  before int := (select stock from public.product_variants where sku = 'TST-RI-50');
begin
  perform public.review_return(current_setting('test.return')::uuid, true, null, 'POST');
  perform public.receive_return(current_setting('test.return')::uuid, 'RESTOCK');
  assert (select stock from public.product_variants where id = v) = before + 1, 'exactly the returned bottle goes back on the shelf';
end $$;

reset role;
