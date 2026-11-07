-- Coupons: evaluation order and messages, scope, caps, redemption on COD order and release on cancel,
-- welcome code at signup, birthday release, and that customers can't list other people's codes.

update public.settings set value = 'true' where key in ('welcome.enabled', 'cod.enabled');
update public.settings set value = '4999' where key = 'shipping.free_threshold';
update public.settings set value = '"TWELCOME"' where key = 'welcome.prefix';
update public.welcome_tiers set is_active = false;
insert into public.welcome_tiers (label, discount_type, value, weight) values ('Test 5% off', 'PERCENT', 5, 100);

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000000f1', 'cpn-admin@test.local', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000f2', 'cpn-cust@test.local', '{"full_name":"Coupon Customer"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000f3', 'cpn-other@test.local', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000f1', 'admin');
update public.profiles set date_of_birth = '1990-03-14' where id = '00000000-0000-0000-0000-0000000000f2';
insert into public.addresses (id, user_id, full_name, phone, line1, city, state, pincode)
values ('00000000-0000-0000-0000-00000000ad02', '00000000-0000-0000-0000-0000000000f2', 'Coupon Customer', '9876543210', '2 Test Road', 'Guntur', 'Andhra Pradesh', '522001');

do $$ begin
  assert (select count(*) from public.coupons where assigned_user_id = '00000000-0000-0000-0000-0000000000f2' and kind = 'welcome') = 1, 'signup issues one welcome code';
  assert (select code from public.coupons where assigned_user_id = '00000000-0000-0000-0000-0000000000f2' and kind = 'welcome') ~ '^TWELCOME-[A-Z0-9]{6}$', 'welcome code uses the prefix';
end $$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}', true);
do $$
declare cat uuid; other_cat uuid;
begin
  insert into public.categories (slug, name) values ('tst-cpn-attars', 'Test Attars') returning id into cat;
  insert into public.categories (slug, name) values ('tst-cpn-other', 'Test Other') returning id into other_cat;
  perform public.save_product(jsonb_build_object('slug', 'tst-cpn-a', 'name', 'Coupon A', 'base_price', 4000, 'is_active', true, 'primary_category_id', cat,
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-CPN-A', 'kind', 'retail', 'size_ml', 50, 'label', '50 ml', 'initial_stock', 10))));
  perform public.save_product(jsonb_build_object('slug', 'tst-cpn-b', 'name', 'Coupon B', 'base_price', 1000, 'is_active', true, 'primary_category_id', other_cat,
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-CPN-B', 'kind', 'retail', 'size_ml', 30, 'label', '30 ml', 'initial_stock', 10))));
  perform public.save_coupon(jsonb_build_object('code', ' tst attar20 ', 'discount_type', 'PERCENT', 'value', 20, 'max_discount', 500,
    'per_customer_limit', 1, 'usage_limit', 5, 'is_active', true, 'is_listed', true, 'category_ids', jsonb_build_array(cat)));
  perform public.save_coupon(jsonb_build_object('code', 'TST-MIN', 'discount_type', 'FLAT', 'value', 300, 'min_order', 5000, 'is_active', true, 'is_listed', true));
  perform public.save_coupon(jsonb_build_object('code', 'TST-LATER', 'discount_type', 'FLAT', 'value', 100, 'starts_at', (now() + interval '2 days')::text, 'is_active', true));
  perform public.save_coupon(jsonb_build_object('code', 'TST-MINE', 'discount_type', 'FLAT', 'value', 50, 'assigned_user_id', '00000000-0000-0000-0000-0000000000f3', 'is_active', true));
  begin
    perform public.save_coupon(jsonb_build_object('code', 'tst-min', 'discount_type', 'FLAT', 'value', 1));
    raise exception 'TEST_FAIL: duplicate code saved';
  exception when others then
    if sqlerrm not like 'COUPON_CODE_TAKEN%' then raise; end if;
  end;
  assert exists (select 1 from public.coupons where code = 'TSTATTAR20'), 'codes are normalised to capitals without spaces';

  -- birthday release, once per year
  assert (select count(*) from public.birthday_customers(3, 14, 2026)) >= 1, 'customer born on 14 March is listed';
  perform public.release_birthday_coupons(3, 14, 2026, '{"prefix":"TBDAY","discount_type":"PERCENT","value":15,"valid_days":14}'::jsonb);
  assert (select public.release_birthday_coupons(3, 14, 2026, '{"prefix":"TBDAY","discount_type":"PERCENT","value":15}'::jsonb)) = 0, 'second release skips customers who have a code';
  assert exists (select 1 from public.coupons where kind = 'birthday' and birthday_year = 2026 and assigned_user_id = '00000000-0000-0000-0000-0000000000f2'), 'birthday code issued';
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f2","role":"authenticated"}', true);
do $$
declare
  a uuid := (select id from public.product_variants where sku = 'TST-CPN-A');
  b uuid := (select id from public.product_variants where sku = 'TST-CPN-B');
  bag jsonb;
  q jsonb;
  res jsonb;
  offers jsonb;
begin
  assert (select count(*) from public.coupons) = 2, 'customers see only their own personal codes';

  bag := jsonb_build_array(jsonb_build_object('variant_id', a, 'qty', 1), jsonb_build_object('variant_id', b, 'qty', 1));
  q := public.quote_order(bag, 'tstattar20');
  assert (q -> 'coupon' ->> 'ok')::boolean, 'category coupon applies';
  assert (q ->> 'discount')::numeric = 500, '20% of the ₹4,000 attar is ₹800, capped at ₹500';
  assert (q ->> 'total')::numeric = 4500 + 250, 'delivery is charged when the discounted total falls below the threshold';

  q := public.quote_order(jsonb_build_array(jsonb_build_object('variant_id', b, 'qty', 1)), 'TSTATTAR20');
  assert q -> 'coupon' ->> 'reason' = 'NOTHING_ELIGIBLE', 'out-of-scope bag is refused';

  q := public.quote_order(bag, 'TST-MIN');
  assert q -> 'coupon' ->> 'reason' = 'NOT_FOUND' or (q -> 'coupon' ->> 'ok')::boolean, 'flat code quoted';
  assert (q -> 'coupon' ->> 'ok')::boolean and (q ->> 'discount')::numeric = 300, '₹5,000 bag meets the ₹5,000 minimum';
  q := public.quote_order(jsonb_build_array(jsonb_build_object('variant_id', a, 'qty', 1)), 'TST-MIN');
  assert q -> 'coupon' ->> 'reason' = 'BELOW_MIN' and q -> 'coupon' ->> 'message' like '%₹5,000%', 'below minimum says how much is needed';

  assert public.quote_order(bag, 'TST-LATER') -> 'coupon' ->> 'reason' = 'NOT_STARTED', 'future code not started';
  assert public.quote_order(bag, 'TST-MINE') -> 'coupon' ->> 'reason' = 'NOT_FOUND', 'someone else''s personal code looks like it doesn''t exist';
  assert public.quote_order(bag, 'NOPE') -> 'coupon' ->> 'reason' = 'NOT_FOUND', 'unknown code';

  offers := public.available_coupons(bag);
  assert (offers -> 0 ->> 'ok')::boolean, 'usable offers come first';
  assert not exists (select 1 from jsonb_array_elements(offers) e where e ->> 'code' = 'TST-MINE'), 'other people''s codes are never listed';
  assert exists (select 1 from jsonb_array_elements(offers) e where e ->> 'kind' = 'welcome'), 'the shopper''s welcome code is listed';

  res := public.create_order('00000000-0000-0000-0000-00000000ad02', bag, 'TSTATTAR20', 'COD', '[]'::jsonb, null, null);
  assert (select discount from public.orders where id = (res ->> 'id')::uuid) = 500, 'order saves the discount';
  -- (customers can't read the coupons table, so check the link through the order itself)
  assert (select coupon_id is not null and coupon_code = 'TSTATTAR20' from public.orders where id = (res ->> 'id')::uuid), 'order links the coupon';
  assert public.quote_order(bag, 'TSTATTAR20') -> 'coupon' ->> 'reason' = 'ALREADY_USED', 'one use per customer';

  perform public.cancel_order((res ->> 'id')::uuid, null);
  assert (public.quote_order(bag, 'TSTATTAR20') -> 'coupon' ->> 'ok')::boolean, 'cancelling releases the use';

  begin
    perform public.create_order('00000000-0000-0000-0000-00000000ad02', bag, 'TST-LATER', 'COD', '[]'::jsonb, null, null);
    raise exception 'TEST_FAIL: ordered with an unusable code';
  exception when others then
    if sqlerrm not like 'COUPON_INVALID%' then raise; end if;
  end;

  res := public.create_order('00000000-0000-0000-0000-00000000ad02', jsonb_build_array(jsonb_build_object('variant_id', b, 'qty', 1)), null, 'COD', '[]'::jsonb, null, null);
  q := public.quote_order(bag, (select code from public.coupons where assigned_user_id = auth.uid() and kind = 'welcome'));
  assert q -> 'coupon' ->> 'reason' = 'FIRST_ORDER', 'welcome code is first-order only';
end $$;
