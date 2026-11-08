-- Orders: server quote, free-sample entitlement and assignment, COD order placement, idempotency,
-- customer cancel with restock, the status machine, and that customers can't edit orders.

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000000e1', 'ord-admin@test.local', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000e2', 'ord-cust@test.local', '{"full_name":"Order Customer"}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000e1', 'admin');

-- Known rules for this test; only our own vials are in the sample list.
update public.settings set value = 'true' where key in ('samples.enabled', 'samples.allow_duplicates', 'cod.enabled');
update public.settings set value = '50' where key = 'samples.ml_per_sample';
update public.settings set value = '4' where key = 'samples.max_per_order';
update public.settings set value = '250' where key = 'shipping.fee';
update public.settings set value = '4999' where key = 'shipping.free_threshold';
update public.settings set value = '0' where key = 'cod.min_order';
update public.product_variants set in_sample_pool = false where kind = 'sample';

insert into public.addresses (id, user_id, full_name, phone, line1, city, state, pincode)
values ('00000000-0000-0000-0000-00000000ad01', '00000000-0000-0000-0000-0000000000e2', 'Order Customer', '9876543210', '1 Test Road', 'Vijayawada', 'Andhra Pradesh', '520001');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
do $$ begin
  perform public.save_product('{
    "slug": "tst-ord-oud", "name": "Order Oud", "base_price": 2000, "is_active": true, "stock_unit": "piece", "counts_toward_samples": true,
    "variants": [
      {"sku": "TST-ORD-50", "kind": "retail", "size_ml": 50, "label": "50 ml", "initial_stock": 10},
      {"sku": "TST-ORD-100", "kind": "retail", "size_ml": 100, "label": "100 ml", "price": 3500, "initial_stock": 5},
      {"sku": "TST-ORD-S5", "kind": "sample", "size_ml": 5, "label": "5 ml sample", "price": 0, "initial_stock": 3, "in_sample_pool": true}
    ]}'::jsonb);
  perform public.save_product('{
    "slug": "tst-ord-rose", "name": "Order Rose", "base_price": 1500, "is_active": true, "stock_unit": "piece",
    "variants": [
      {"sku": "TST-ROSE-30", "kind": "retail", "size_ml": 30, "label": "30 ml", "initial_stock": 4},
      {"sku": "TST-ROSE-S5", "kind": "sample", "size_ml": 5, "label": "5 ml sample", "price": 0, "initial_stock": 1, "in_sample_pool": true}
    ]}'::jsonb);
end $$;

-- ===== as the customer =====
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e2","role":"authenticated"}', true);
do $$
declare
  v50 uuid := (select id from public.product_variants where sku = 'TST-ORD-50');
  v100 uuid := (select id from public.product_variants where sku = 'TST-ORD-100');
  s_oud uuid := (select id from public.product_variants where sku = 'TST-ORD-S5');
  s_rose uuid := (select id from public.product_variants where sku = 'TST-ROSE-S5');
  q jsonb;
  res jsonb;
  again jsonb;
  oid uuid;
  ref uuid := gen_random_uuid();
begin
  q := public.quote_order(jsonb_build_array(jsonb_build_object('variant_id', v50, 'qty', 1)));
  assert (q ->> 'subtotal')::numeric = 2000, 'variant without its own price uses the base price';
  assert (q ->> 'shipping')::numeric = 250, 'delivery fee below the threshold';
  assert (q ->> 'total')::numeric = 2250, 'total = subtotal + delivery';
  assert (q -> 'samples' ->> 'entitlement')::int = 1, 'one 50 ml bottle earns one sample';
  assert (q -> 'samples' ->> 'next_threshold_ml')::numeric = 50, 'next sample needs 50 ml more';

  q := public.quote_order(jsonb_build_array(jsonb_build_object('variant_id', v50, 'qty', 1), jsonb_build_object('variant_id', v100, 'qty', 1)));
  assert (q ->> 'subtotal')::numeric = 5500, 'two lines priced';
  assert (q ->> 'shipping')::numeric = 0, 'free delivery at or above the threshold';
  assert (q -> 'samples' ->> 'entitlement')::int = 3, '150 ml earns three samples';

  q := public.quote_order(jsonb_build_array(jsonb_build_object('variant_id', v50, 'qty', 20)));
  assert jsonb_array_length(q -> 'problems') = 1 and q -> 'problems' -> 0 ->> 'reason' = 'LOW_STOCK', 'short stock is listed, not thrown';

  q := public.quote_order(jsonb_build_array(jsonb_build_object('variant_id', s_oud, 'qty', 1)));
  assert q -> 'problems' -> 0 ->> 'reason' = 'UNAVAILABLE', 'sample vials cannot be bought';

  res := public.create_order('00000000-0000-0000-0000-00000000ad01',
    jsonb_build_array(jsonb_build_object('variant_id', v50, 'qty', 1), jsonb_build_object('variant_id', v100, 'qty', 1)),
    null, 'COD', jsonb_build_array(s_oud), 'Leave at the door', ref);
  oid := (res ->> 'id')::uuid;
  assert res ->> 'order_number' like 'SAU-%', 'human order number';
  assert (select count(*) from public.order_items where order_id = oid and line_type = 'item') = 2, 'two paid lines';
  assert (select count(*) from public.order_items where order_id = oid and line_type = 'sample') = 3, 'three free samples';
  assert (select samples_short from public.orders where id = oid) = 0, 'no shortfall while vials are in stock';
  assert exists (select 1 from public.order_items where order_id = oid and line_type = 'sample' and variant_id = s_oud and not sample_auto), 'the customer pick is honoured';
  assert (select stock from public.product_variants where id = v50) = 9, 'bottle stock goes down at COD order';
  assert (select stock from public.product_variants where id = v100) = 4, 'bottle stock goes down at COD order';
  assert (select stock from public.product_variants where id = s_oud) + (select stock from public.product_variants where id = s_rose) = 1, 'three vials left the shelf';
  assert (select total from public.orders where id = oid) = 5500, 'order saves the quoted total';
  assert not exists (select 1 from public.carts where user_id = auth.uid()), 'bag is emptied';

  again := public.create_order('00000000-0000-0000-0000-00000000ad01',
    jsonb_build_array(jsonb_build_object('variant_id', v50, 'qty', 1)), null, 'COD', '[]'::jsonb, null, ref);
  assert (again ->> 'id')::uuid = oid and (again ->> 'duplicate')::boolean, 'same client ref returns the same order';

  update public.orders set total = 1 where id = oid;
  assert (select total from public.orders where id = oid) = 5500, 'customers cannot edit their order';

  begin
    perform public.set_order_status(oid, 'PACKED', null);
    raise exception 'TEST_FAIL: customer changed status';
  exception when others then
    if sqlerrm not like 'NOT_ADMIN%' then raise; end if;
  end;

  perform public.cancel_order(oid, 'Changed my mind');
  assert (select status from public.orders where id = oid) = 'CANCELLED', 'customer can cancel while pending';
  assert (select stock from public.product_variants where id = v50) = 10, 'cancel restocks bottles';
  assert (select stock from public.product_variants where id = s_oud) = 3 and (select stock from public.product_variants where id = s_rose) = 1, 'cancel restocks samples';
  perform public.cancel_order(oid, 'twice');
  assert (select stock from public.product_variants where id = v50) = 10, 'cancelling twice restocks once';

  begin
    perform public.create_order('00000000-0000-0000-0000-00000000ad01',
      jsonb_build_array(jsonb_build_object('variant_id', v50, 'qty', 50)), null, 'COD', '[]'::jsonb, null, null);
    raise exception 'TEST_FAIL: oversold';
  exception when others then
    if sqlerrm not like 'OUT_OF_STOCK%' then raise; end if;
  end;

  -- a second order for the admin flow
  res := public.create_order('00000000-0000-0000-0000-00000000ad01',
    jsonb_build_array(jsonb_build_object('variant_id', v100, 'qty', 1)), null, 'COD', '[]'::jsonb, null, null);
  perform set_config('test.order2', res ->> 'id', true);
end $$;

-- ===== as the admin =====
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
do $$
declare oid uuid := current_setting('test.order2')::uuid;
begin
  begin
    perform public.set_order_status(oid, 'DELIVERED', null);
    raise exception 'TEST_FAIL: skipped straight to delivered';
  exception when others then
    if sqlerrm not like 'STATUS_NOT_ALLOWED%' then raise; end if;
  end;
  perform public.set_order_status(oid, 'PACKED', null);
  perform public.set_order_status(oid, 'SHIPPED', null);
  begin
    perform public.cancel_order(oid, null);
    raise exception 'TEST_FAIL: cancelled a shipped order';
  exception when others then
    if sqlerrm not like 'CANCEL_TOO_LATE%' then raise; end if;
  end;
  perform public.set_order_status(oid, 'DELIVERED', 'Handed over');
  assert (select payment_status from public.orders where id = oid) = 'PAID', 'delivered COD is marked paid';
  assert (select count(*) from public.order_events where order_id = oid) = 4, 'every step is in the history';
  update public.orders set tracking_number = 'EK1IN', admin_note = 'ok' where id = oid;
  assert (select tracking_number from public.orders where id = oid) = 'EK1IN', 'admins can edit tracking directly';
end $$;
