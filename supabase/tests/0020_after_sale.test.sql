-- After the sale: pincode rules, manual shipping, online payment confirmation (service role), returns with
-- restock / write-off and manual refund, verified-buyer reviews and ratings, wishlist, back-in-stock.

update public.settings set value = 'true' where key in ('cod.enabled', 'samples.enabled', 'payments.online_enabled');
update public.settings set value = '7' where key = 'returns.window_days';
update public.settings set value = '"other"' where key = 'shipping.default_courier';
update public.settings set value = '["110099"]' where key = 'shipping.blocked_pincodes';
update public.settings set value = '["560099"]' where key = 'shipping.cod_blocked_pincodes';
update public.product_variants set in_sample_pool = false where kind = 'sample';

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000000b1', 'as-admin@test.local', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b2', 'as-cust@test.local', '{"full_name":"After Sale"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b3', 'as-other@test.local', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000b1', 'admin');
insert into public.addresses (id, user_id, full_name, phone, line1, city, state, pincode) values
  ('00000000-0000-0000-0000-00000000ad11', '00000000-0000-0000-0000-0000000000b2', 'After Sale', '9876543210', '3 Test Road', 'Vizag', 'Andhra Pradesh', '530001'),
  ('00000000-0000-0000-0000-00000000ad12', '00000000-0000-0000-0000-0000000000b2', 'After Sale', '9876543210', '4 Test Road', 'Delhi', 'Delhi', '110099'),
  ('00000000-0000-0000-0000-00000000ad13', '00000000-0000-0000-0000-0000000000b2', 'After Sale', '9876543210', '5 Test Road', 'Bengaluru', 'Karnataka', '560099');

do $$ begin
  assert (public.check_pincode('530001') ->> 'serviceable')::boolean and (public.check_pincode('530001') ->> 'cod')::boolean, 'normal pincode: delivers with COD';
  assert not (public.check_pincode('110099') ->> 'serviceable')::boolean, 'blocked pincode is refused';
  assert not (public.check_pincode('560099') ->> 'cod')::boolean, 'COD-blocked pincode is prepaid only';
  assert not (public.check_pincode('12345') ->> 'valid')::boolean, 'bad format is invalid';
end $$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
do $$ begin
  perform public.save_product('{
    "slug": "tst-as-oud", "name": "After Sale Oud", "base_price": 3000, "is_active": true,
    "variants": [{"sku": "TST-AS-50", "kind": "retail", "size_ml": 50, "label": "50 ml", "initial_stock": 5}]}'::jsonb);
end $$;

-- ===== customer
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
do $$
declare
  v uuid := (select id from public.product_variants where sku = 'TST-AS-50');
  bag jsonb := jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'TST-AS-50'), 'qty', 1));
  r jsonb;
begin
  begin
    perform public.create_order('00000000-0000-0000-0000-00000000ad12', bag, null, 'COD', '[]'::jsonb, null, null);
    raise exception 'TEST_FAIL: ordered to a blocked pincode';
  exception when others then
    if sqlerrm not like 'PINCODE_UNSERVICEABLE%' then raise; end if;
  end;
  begin
    perform public.create_order('00000000-0000-0000-0000-00000000ad13', bag, null, 'COD', '[]'::jsonb, null, null);
    raise exception 'TEST_FAIL: COD to a COD-blocked pincode';
  exception when others then
    if sqlerrm not like 'COD_UNAVAILABLE%' then raise; end if;
  end;

  -- online order: nothing reserved until paid
  r := public.create_order('00000000-0000-0000-0000-00000000ad11', bag, null, 'ONLINE', '[]'::jsonb, null, null);
  perform set_config('test.online', r ->> 'id', true);
  assert (select stock from public.product_variants where id = v) = 5, 'online order reserves nothing before payment';
  begin
    perform public.confirm_order_payment((r ->> 'id')::uuid, 'order_x', 'pay_x', 300000);
    raise exception 'TEST_FAIL: customer confirmed a payment';
  exception when others then
    if sqlerrm not like '%permission denied%' then raise; end if;
  end;

  -- COD order to deliver, return and review
  r := public.create_order('00000000-0000-0000-0000-00000000ad11', bag, null, 'COD', '[]'::jsonb, null, null);
  perform set_config('test.cod', r ->> 'id', true);
  begin
    perform public.request_return((r ->> 'id')::uuid, 'DAMAGED', 'x', '[]'::jsonb, '[]'::jsonb);
    raise exception 'TEST_FAIL: return before delivery';
  exception when others then
    if sqlerrm not like 'RETURN_NOT_ALLOWED%' then raise; end if;
  end;
end $$;

-- ===== service role confirms the online payment
reset role;
set local role service_role;
do $$
declare oid uuid := current_setting('test.online')::uuid;
begin
  perform public.set_razorpay_order(oid, 'order_test_1');
  begin
    perform public.confirm_order_payment(oid, 'order_test_1', 'pay_test_1', 1);
    raise exception 'TEST_FAIL: wrong amount accepted';
  exception when others then
    if sqlerrm not like 'PAYMENT_MISMATCH%' then raise; end if;
  end;
  perform public.confirm_order_payment(oid, 'order_test_1', 'pay_test_1', (select round(total * 100)::bigint from public.orders where id = oid));
  assert (select payment_status from public.orders where id = oid) = 'PAID', 'payment confirmed';
  assert (select stock from public.product_variants where sku = 'TST-AS-50') = 3, 'stock taken for the paid online order and the COD order';
  assert (public.confirm_order_payment(oid, 'order_test_1', 'pay_test_1', (select round(total * 100)::bigint from public.orders where id = oid)) ->> 'status') = 'already_paid', 'confirming twice is safe';
end $$;
reset role;

-- ===== admin ships and delivers the COD order
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
do $$
declare oid uuid := current_setting('test.cod')::uuid;
begin
  perform public.set_order_status(oid, 'PACKED', null);
  perform public.ship_order(oid, 'other', 'TRK-1', null);
  assert (select status from public.orders where id = oid) = 'SHIPPED', 'manual shipping marks shipped';
  assert (select tracking_number from public.orders where id = oid) = 'TRK-1', 'tracking saved';
  perform public.set_order_status(oid, 'DELIVERED', null);
end $$;

-- ===== customer returns it and reviews it
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
do $$
declare
  oid uuid := current_setting('test.cod')::uuid;
  item uuid := (select id from public.order_items where order_id = current_setting('test.cod')::uuid and line_type = 'item');
  rid uuid;
begin
  rid := public.request_return(oid, 'LEAKING', 'Cap cracked', jsonb_build_array(jsonb_build_object('order_item_id', item, 'qty', 1)), '[]'::jsonb);
  perform set_config('test.return', rid::text, true);
  assert (select status from public.returns where id = rid) = 'REQUESTED', 'return requested';

  perform public.submit_review(item, 4, 'Lovely', 'Lasts all day', null, null, 'Asha', 'Vizag', '[]'::jsonb);
  assert (select status from public.reviews where order_item_id = item) = 'PENDING', 'reviews wait for approval';
  begin
    perform public.submit_review(item, 5, null, null, null, null, 'Asha', null, '[]'::jsonb);
    raise exception 'TEST_FAIL: reviewed twice';
  exception when others then
    if sqlerrm not like 'REVIEW_EXISTS%' then raise; end if;
  end;

  assert array_length(public.set_wishlist(array['tst-as-oud', 'no-such-product']), 1) = 1, 'wishlist keeps real products only';
  perform public.request_back_in_stock((select id from public.product_variants where sku = 'TST-AS-50'), null);
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b3","role":"authenticated"}', true);
do $$ begin
  begin
    perform public.submit_review((select id from public.order_items where order_id = current_setting('test.cod')::uuid and line_type = 'item'), 1, null, null, null, null, 'X', null, '[]'::jsonb);
    raise exception 'TEST_FAIL: non-buyer reviewed';
  exception when others then
    if sqlerrm not like 'REVIEW_NOT_ALLOWED%' then raise; end if;
  end;
  assert (select count(*) from public.returns) = 0, 'other customers cannot see the return';
end $$;

-- ===== admin resolves the return and approves the review
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
do $$
declare rid uuid := current_setting('test.return')::uuid; pid uuid := (select id from public.products where slug = 'tst-as-oud'); before int;
begin
  perform public.review_return(rid, true, 'Please post it back', 'POST');
  select stock into before from public.product_variants where sku = 'TST-AS-50';
  perform public.receive_return(rid, 'WRITE_OFF');
  assert (select stock from public.product_variants where sku = 'TST-AS-50') = before, 'a written-off leak is not put back on sale';
  assert exists (select 1 from public.inventory_movements where reason = 'write_off' and note like '%written off%'), 'write-off is logged';
  begin
    perform public.refund_return_manually(rid, 3000, '', null);
    raise exception 'TEST_FAIL: refund without reference';
  exception when others then
    if sqlerrm not like 'REFUND_REFERENCE%' then raise; end if;
  end;
  perform public.refund_return_manually(rid, 3000, 'UPI 1234', null);
  assert (select status from public.returns where id = rid) = 'REFUNDED', 'return refunded';
  -- ₹3,000 back on a ₹3,250 order (₹250 delivery kept) is a partial refund
  assert (select payment_status from public.orders where id = current_setting('test.cod')::uuid) = 'PARTIALLY_REFUNDED', 'item refund is partial when delivery was charged';

  assert (select rating_count from public.products where id = pid) = 0, 'pending reviews do not count';
  perform public.moderate_review((select id from public.reviews where product_id = pid), 'APPROVED', null);
  assert (select rating_count from public.products where id = pid) = 1 and (select rating_avg from public.products where id = pid) = 4, 'approved review sets the rating';
  assert (public.product_reviews('tst-as-oud') ->> 'count')::int = 1, 'product page lists the approved review';
  assert exists (select 1 from public.admin_notifications where kind = 'review'), 'admin is notified of the review';
end $$;
