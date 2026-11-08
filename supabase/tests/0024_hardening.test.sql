-- Hardening: who can call what, coupons held by unpaid online orders, COD limits, the first-order phone check,
-- the refund ledger (several partial refunds, never more than paid), refunds due, and the real-IP rate-limit key.

-- ============================================================ privileges
do $$
declare bad text;
begin
  select string_agg(p.proname, ', ') into bad
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef and has_function_privilege('anon', p.oid, 'execute')
    and p.proname <> all (array['is_admin', 'product_is_visible', 'page_is_published', 'site_bootstrap', 'quote_order', 'sample_pool',
      'available_coupons', 'check_pincode', 'product_reviews', 'request_back_in_stock', 'subscribe_newsletter']);
  assert bad is null, 'visitors can call only the storefront functions, not: ' || coalesce(bad, '');

  select string_agg(p.proname, ', ') into bad
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef and has_function_privilege('authenticated', p.oid, 'execute')
    and p.proname = any (array['confirm_order_payment', 'set_razorpay_order', 'mark_payment_failed', 'record_refund', 'begin_refund',
      'finish_refund', 'update_refund_status', 'apply_shipment_status', 'save_shipment_booking', 'has_role', 'handle_new_user']);
  assert bad is null, 'signed-in users cannot call server-only functions: ' || coalesce(bad, '');

  select string_agg(c.relname, ', ') into bad
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and (has_table_privilege('anon', c.oid, 'insert') or has_table_privilege('anon', c.oid, 'update') or has_table_privilege('anon', c.oid, 'delete'));
  assert bad is null, 'visitors cannot write any table directly: ' || coalesce(bad, '');

  select string_agg(c.relname, ', ') into bad
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  assert bad is null, 'every table has row level security: ' || coalesce(bad, '');
end $$;

-- ============================================================ fixtures
update public.settings set value = 'true' where key in ('cod.enabled', 'payments.online_enabled', 'coupons.first_order_phone_check', 'payments.auto_refund_on_cancel');
update public.settings set value = 'false' where key in ('welcome.enabled', 'samples.enabled');
update public.settings set value = '0' where key in ('shipping.free_threshold', 'cod.min_order', 'cod.max_order');
update public.settings set value = '2' where key = 'cod.max_open_orders';

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000024a1', 'hard-admin@test.local', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000024c1', 'hard-one@test.local', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000024c2', 'hard-two@test.local', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000024a1', 'admin');
insert into public.addresses (id, user_id, full_name, phone, line1, city, state, pincode) values
  ('00000000-0000-0000-0000-00000024ad01', '00000000-0000-0000-0000-0000000024c1', 'Hard One', '9800011111', '1 Test Road', 'Guntur', 'Andhra Pradesh', '522001'),
  ('00000000-0000-0000-0000-00000024ad02', '00000000-0000-0000-0000-0000000024c2', 'Hard Two', '9800011111', '2 Test Road', 'Guntur', 'Andhra Pradesh', '522001');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000024a1","role":"authenticated"}', true);
do $$ begin
  perform public.save_product(jsonb_build_object('slug', 'tst-hard-a', 'name', 'Hard A', 'base_price', 2000, 'is_active', true,
    'primary_category_id', (select id from public.categories order by created_at limit 1),
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-HARD-A', 'kind', 'retail', 'size_ml', 50, 'label', '50 ml', 'initial_stock', 20))));
  perform public.save_coupon(jsonb_build_object('code', 'TST-ONCE', 'discount_type', 'FLAT', 'value', 100, 'per_customer_limit', 1, 'is_active', true));
  perform public.save_coupon(jsonb_build_object('code', 'TST-FIRST', 'discount_type', 'FLAT', 'value', 150, 'per_customer_limit', 1, 'first_order_only', true, 'is_active', true));
end $$;

-- ============================================================ coupons are held by unpaid online orders
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000024c1","role":"authenticated"}', true);
do $$
declare
  bag jsonb := jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'TST-HARD-A'), 'qty', 1));
  online jsonb;
  q jsonb;
begin
  online := public.create_order('00000000-0000-0000-0000-00000024ad01', bag, 'TST-ONCE', 'ONLINE');
  assert exists (select 1 from public.coupon_redemptions where order_id = (online ->> 'id')::uuid and released_at is null), 'an unpaid online order holds its coupon';

  q := public.quote_order(bag, 'TST-ONCE', 'COD');
  assert q -> 'coupon' ->> 'reason' = 'HELD', 'the same one-use code is refused while the online order holds it';
  assert q -> 'coupon' ->> 'message' like '%' || (online ->> 'order_number') || '%', 'the message names the order holding the code';
  begin
    perform public.create_order('00000000-0000-0000-0000-00000024ad01', bag, 'TST-ONCE', 'ONLINE');
    raise exception 'TEST_FAIL: one-use coupon used on a second online order';
  exception when others then
    if sqlerrm not like 'COUPON_INVALID%' then raise; end if;
  end;

  perform public.cancel_order((online ->> 'id')::uuid, 'changed my mind');
  q := public.quote_order(bag, 'TST-ONCE', 'COD');
  assert (q -> 'coupon' ->> 'ok')::boolean, 'cancelling the unpaid order frees the code';

  -- An unpaid online order is not a "first order".
  online := public.create_order('00000000-0000-0000-0000-00000024ad01', bag, null, 'ONLINE');
  q := public.quote_order(bag, 'TST-FIRST', 'COD');
  assert (q -> 'coupon' ->> 'ok')::boolean, 'an unpaid online order does not use up a first-order offer';
  perform public.cancel_order((online ->> 'id')::uuid, null);

  -- COD: open orders per customer.
  perform public.create_order('00000000-0000-0000-0000-00000024ad01', bag, null, 'COD');
  perform public.create_order('00000000-0000-0000-0000-00000024ad01', bag, null, 'COD');
  begin
    perform public.create_order('00000000-0000-0000-0000-00000024ad01', bag, null, 'COD');
    raise exception 'TEST_FAIL: third open COD order accepted';
  exception when others then
    if sqlerrm not like 'COD_LIMIT%' then raise; end if;
  end;
end $$;

-- COD: largest order.
reset role;
update public.settings set value = '1000' where key = 'cod.max_order';
set local role authenticated;
do $$
declare q jsonb := public.quote_order(jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'TST-HARD-A'), 'qty', 1)), null, 'COD');
begin
  assert not (q -> 'cod' ->> 'allowed')::boolean and q -> 'cod' ->> 'reason' = 'COD_MAX', 'orders above the COD limit must be paid online';
  assert q -> 'cod' ->> 'message' like '%₹1,000%', 'the message says the limit';
end $$;
reset role;
update public.settings set value = '0' where key = 'cod.max_order';
set local role authenticated;

-- First-order offers: the phone number on the address has ordered before (from customer one's COD orders).
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000024c2","role":"authenticated"}', true);
do $$
declare bag jsonb := jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'TST-HARD-A'), 'qty', 1));
begin
  assert (public.quote_order(bag, 'TST-FIRST', 'COD') -> 'coupon' ->> 'ok')::boolean, 'a new account can see the first-order offer';
  begin
    perform public.create_order('00000000-0000-0000-0000-00000024ad02', bag, 'TST-FIRST', 'COD');
    raise exception 'TEST_FAIL: first-order offer used with a phone number that has ordered before';
  exception when others then
    if sqlerrm not like 'COUPON_INVALID%phone number%' then raise; end if;
  end;
end $$;

-- ============================================================ refund ledger
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000024c2","role":"authenticated"}', true);
create temp table t_paid on commit drop as
  select (public.create_order('00000000-0000-0000-0000-00000024ad02',
    jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'TST-HARD-A'), 'qty', 1)), null, 'ONLINE') ->> 'id')::uuid as id;
grant select on t_paid to public;

reset role;
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
do $$
declare oid uuid := (select id from t_paid); o public.orders; r1 jsonb; r2 jsonb;
begin
  perform public.set_razorpay_order(oid, 'order_TEST24');
  select * into o from public.orders where id = oid;
  perform public.confirm_order_payment(oid, 'order_TEST24', 'pay_TEST24', round(o.total * 100)::bigint);
  assert (select payment_status from public.orders where id = oid) = 'PAID', 'payment confirmed';

  r1 := public.begin_refund(oid, 500, 'part one', null);
  assert (select amount_refunded from public.orders where id = oid) = 500, 'the refund is reserved before Razorpay is called';
  assert (select payment_status from public.orders where id = oid) = 'PARTIALLY_REFUNDED', 'partly refunded';
  begin
    perform public.begin_refund(oid, o.total, 'too much', null);
    raise exception 'TEST_FAIL: refunded more than was paid';
  exception when others then
    if sqlerrm not like 'REFUND_AMOUNT%' then raise; end if;
  end;
  perform public.finish_refund((r1 ->> 'refund_id')::uuid, 'rfnd_TEST1', 'FAILED', 'bank declined');
  assert (select amount_refunded from public.orders where id = oid) = 0, 'a failed refund frees its amount';
  assert (select payment_status from public.orders where id = oid) = 'PAID', 'and the order is fully paid again';

  r1 := public.begin_refund(oid, 300, null, null);
  r2 := public.begin_refund(oid, 200, null, null);
  perform public.finish_refund((r1 ->> 'refund_id')::uuid, 'rfnd_TEST2', 'PROCESSING');
  assert public.update_refund_status('rfnd_TEST2', 'REFUNDED'), 'the webhook finds the refund by its Razorpay id';
  assert not public.update_refund_status('rfnd_UNKNOWN', 'REFUNDED'), 'unknown refund ids are reported, not ignored silently';
  perform public.finish_refund((r1 ->> 'refund_id')::uuid, null, 'PROCESSING');
  assert (select status from public.refunds where id = (r1 ->> 'refund_id')::uuid) = 'REFUNDED', 'a late "processing" never undoes a finished refund';
  assert (select amount_refunded from public.orders where id = oid) = 500, 'several partial refunds add up';
end $$;

-- Razorpay statuses can't be changed by hand; cancelling a paid order lists it as a refund due and tells the admin.
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000024a1","role":"authenticated"}', true);
do $$
declare oid uuid := (select id from t_paid);
begin
  begin
    perform public.update_refund((select id from public.refunds where razorpay_refund_id = 'rfnd_TEST2'), 'FAILED', null);
    raise exception 'TEST_FAIL: an online refund status was changed by hand';
  exception when others then
    if sqlerrm not like 'REFUND_STATUS%' then raise; end if;
  end;
  perform public.cancel_order(oid, 'customer asked');
  assert exists (select 1 from public.refunds_due() where order_id = oid), 'a cancelled paid order is listed as a refund due';
  assert exists (select 1 from public.admin_notifications where kind = 'refund' and title like 'Refund due%'), 'the admin is told';
  assert (select jsonb_array_length(public.admin_dashboard(30) -> 'setup')) = 7, 'the dashboard has the setup checklist';
  assert (public.admin_dashboard(30) -> 'kpis' ->> 'refunds_due')::int >= 1, 'and counts refunds due';
end $$;

-- ============================================================ rate limits use the real client IP
reset role;
do $$ begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.headers', '{"x-forwarded-for":"1.2.3.4, 203.0.113.9","sb-forwarded-for":"203.0.113.9","cf-connecting-ip":"203.0.113.9"}', true);
  assert app_private.caller_key() = 'ip:203.0.113.9', 'a spoofed X-Forwarded-For value is ignored';
  perform set_config('request.headers', '{"x-forwarded-for":"1.2.3.4, 198.51.100.7"}', true);
  assert app_private.caller_key() = 'ip:198.51.100.7', 'without edge headers the closest proxy''s value is used';
end $$;
