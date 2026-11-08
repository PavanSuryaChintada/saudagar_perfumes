-- 0024_hardening: the security and performance pass after the full build.
--
--  Money
--   * Coupons are held from the moment an order is placed, whatever the payment method, and released when the
--     order is cancelled or expires. Before, an unpaid online order held nothing, so a one-use code could be
--     stacked on several online orders.
--   * Refunds go through a ledger that reserves the amount before Razorpay is called: several partial refunds are
--     possible, a double click can't refund twice, and Razorpay statuses can't be overwritten by hand.
--   * A paid online order that is cancelled is refunded automatically (and always listed as "refund due").
--   * Cash on delivery: largest COD order, open COD orders per customer, first-order offers checked by phone.
--  Access
--   * SECURITY DEFINER functions are callable only by the roles that need them; visitors can't write any table.
--   * Rate limits use the real client IP (X-Forwarded-For's first value is whatever the caller sends).
--   * Storage buckets can no longer be listed by the public.
--  Speed
--   * RLS policies evaluate auth.uid() / is_admin() once per query, one permissive policy per action,
--     an index for every foreign key, pg_net out of the public schema.

-- ============================================================ settings
insert into public.settings (key, value, is_public, description) values
  ('cod.max_order', '0', false, 'Largest order total allowed with cash on delivery (0 = no limit)'),
  ('cod.max_open_orders', '3', false, 'Cash-on-delivery orders one customer can have on the way at once (0 = no limit)'),
  ('coupons.first_order_phone_check', 'true', false, 'First-order offers also check the phone number, so one person can''t claim them again from a new account'),
  ('payments.auto_refund_on_cancel', 'true', false, 'Refund paid online orders automatically when they are cancelled')
on conflict (key) do nothing;

alter table public.admin_notifications drop constraint if exists admin_notifications_kind_check;
alter table public.admin_notifications add constraint admin_notifications_kind_check
  check (kind in ('order', 'shipping', 'return', 'low_stock', 'review', 'back_in_stock', 'refund'));

create index if not exists orders_customer_phone_idx on public.orders (customer_phone) where status <> 'CANCELLED';
create index if not exists orders_user_cod_open_idx on public.orders (user_id) where payment_method = 'COD' and status in ('PENDING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY');

-- ============================================================ quote: largest COD order
create or replace function app_private.quote(p_user uuid, p_items jsonb, p_coupon text, p_payment text, p_samples jsonb)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  r record;
  lines jsonb := '[]'::jsonb;
  problems jsonb := '[]'::jsonb;
  subtotal numeric := 0;
  eligible_ml numeric := 0;
  item_count int := 0;
  coupon jsonb;
  discount numeric := 0;
  after_discount numeric;
  fee numeric := app_private.setting_num('shipping.fee', 0);
  threshold numeric := app_private.setting_num('shipping.free_threshold', 0);
  shipping numeric;
  total numeric;
  cod_enabled boolean := app_private.setting_bool('cod.enabled', false);
  cod_min numeric := app_private.setting_num('cod.min_order', 0);
  cod_max numeric := app_private.setting_num('cod.max_order', 0);
  online_on boolean := app_private.setting_bool('payments.online_enabled', false);
  cod_reason text;
  s_enabled boolean := app_private.setting_bool('samples.enabled', false);
  ml_per numeric := app_private.setting_num('samples.ml_per_sample', 50);
  max_per int := app_private.setting_num('samples.max_per_order', 0)::int;
  allow_dup boolean := app_private.setting_bool('samples.allow_duplicates', true);
  entitlement int := 0;
  next_ml numeric;
  accepted jsonb := '[]'::jsonb;
  rejected jsonb := '[]'::jsonb;
  seen uuid[] := '{}';
  pick jsonb;
  pick_id uuid;
  label_text text;
begin
  for r in
    with req as (
      select (e ->> 'variant_id')::uuid as variant_id,
             least(99, sum(greatest(1, least(99, coalesce(nullif(e ->> 'qty', '')::int, 1)))))::int as qty
      from jsonb_array_elements(case when jsonb_typeof(p_items) = 'array' then p_items else '[]'::jsonb end) e
      where coalesce(e ->> 'variant_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      group by 1
    )
    select req.variant_id, req.qty, v.id as vid, v.kind, v.stock, v.size_ml, v.label, v.sku,
           (v.is_active and not v.is_hidden and p.is_active and p.archived_at is null) as sellable,
           coalesce(v.price, p.base_price) as unit_price,
           coalesce(v.compare_at_price, p.compare_at_price) as compare_at,
           p.id as product_id, p.name, p.slug, p.counts_toward_samples,
           (select m.url from public.product_media m
             where m.product_id = p.id and m.kind = 'image'
             order by (m.variant_id is not distinct from v.id) desc, m.position limit 1) as image
    from req
    left join public.product_variants v on v.id = req.variant_id
    left join public.products p on p.id = v.product_id
    order by p.name, v.size_ml
  loop
    label_text := coalesce(r.name || ' · ' || r.label, 'An item in your bag');
    if r.vid is null or r.kind <> 'retail' or not r.sellable then
      problems := problems || jsonb_build_object('variant_id', r.variant_id, 'reason', 'UNAVAILABLE', 'name', r.name, 'label', r.label,
        'available', 0, 'requested', r.qty, 'message', label_text || ' is no longer available.');
      continue;
    end if;
    if r.stock < r.qty then
      problems := problems || jsonb_build_object('variant_id', r.variant_id, 'reason', case when r.stock = 0 then 'OUT_OF_STOCK' else 'LOW_STOCK' end,
        'name', r.name, 'label', r.label, 'available', r.stock, 'requested', r.qty,
        'message', case when r.stock = 0 then label_text || ' is out of stock.'
                        else 'Only ' || r.stock || ' left of ' || label_text || '. You asked for ' || r.qty || '.' end);
      continue;
    end if;
    lines := lines || jsonb_build_object('variant_id', r.vid, 'product_id', r.product_id, 'name', r.name, 'slug', r.slug,
      'label', r.label, 'sku', r.sku, 'size_ml', r.size_ml, 'image', r.image, 'qty', r.qty, 'stock', r.stock,
      'unit_price', r.unit_price, 'compare_at_price', r.compare_at, 'line_total', r.unit_price * r.qty);
    subtotal := subtotal + r.unit_price * r.qty;
    item_count := item_count + r.qty;
    if r.counts_toward_samples and r.size_ml is not null then
      eligible_ml := eligible_ml + r.size_ml * r.qty;
    end if;
  end loop;

  coupon := app_private.coupon_quote(p_user, p_coupon, subtotal, lines);
  if coalesce((coupon ->> 'ok')::boolean, false) then
    discount := least(subtotal, coalesce((coupon ->> 'discount')::numeric, 0));
  end if;
  after_discount := greatest(0, subtotal - discount);
  -- Settings: "free delivery from X"; 0 means every order ships free.
  shipping := case when jsonb_array_length(lines) = 0 then 0
                   when after_discount >= threshold then 0
                   else fee end;
  total := after_discount + shipping;

  cod_reason := case when not cod_enabled then 'COD_OFF'
                     when cod_min > 0 and total < cod_min then 'COD_MIN'
                     when cod_max > 0 and total > cod_max then 'COD_MAX' end;

  if s_enabled and ml_per > 0 and max_per > 0 then
    entitlement := least(max_per, floor(eligible_ml / ml_per))::int;
    if entitlement < max_per then
      next_ml := ml_per * (entitlement + 1) - eligible_ml;
    end if;
  end if;

  for pick in select e from jsonb_array_elements(case when jsonb_typeof(p_samples) = 'array' then p_samples else '[]'::jsonb end) e loop
    if jsonb_array_length(accepted) >= entitlement then
      rejected := rejected || jsonb_build_object('variant_id', pick #>> '{}', 'reason', 'OVER_LIMIT');
      continue;
    end if;
    if jsonb_typeof(pick) <> 'string' or coalesce(pick #>> '{}', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      accepted := accepted || 'null'::jsonb;  -- surprise me
      continue;
    end if;
    pick_id := (pick #>> '{}')::uuid;
    if not exists (
      select 1 from public.product_variants v join public.products p on p.id = v.product_id
      where v.id = pick_id and v.kind = 'sample' and v.in_sample_pool and v.is_active and not v.is_hidden
        and v.stock > 0 and p.is_active and p.archived_at is null) then
      rejected := rejected || jsonb_build_object('variant_id', pick_id, 'reason', 'UNAVAILABLE');
      continue;
    end if;
    if not allow_dup and pick_id = any (seen) then
      rejected := rejected || jsonb_build_object('variant_id', pick_id, 'reason', 'DUPLICATE');
      continue;
    end if;
    accepted := accepted || to_jsonb(pick_id);
    seen := seen || pick_id;
  end loop;

  return jsonb_build_object(
    'lines', lines,
    'problems', problems,
    'item_count', item_count,
    'subtotal', subtotal,
    'coupon', coupon,
    'discount', discount,
    'shipping', shipping,
    'total', total,
    'free_shipping', jsonb_build_object('threshold', case when threshold > 0 then threshold end,
                                        'remaining', case when threshold > 0 then greatest(0, threshold - after_discount) end),
    'cod', jsonb_build_object('allowed', cod_reason is null, 'reason', cod_reason, 'min_order', cod_min,
      'max_order', case when cod_max > 0 then cod_max end,
      'message', case cod_reason
        when 'COD_OFF' then 'Cash on delivery is not available right now.'
        when 'COD_MIN' then 'Cash on delivery is available on orders of ' || app_private.rupees(cod_min) || ' or more.'
        when 'COD_MAX' then 'Cash on delivery is available on orders up to ' || app_private.rupees(cod_max) || '. '
          || case when online_on then 'Please pay online for this order.' else 'Split the order, or contact us and we''ll help.' end
      end),
    'online', jsonb_build_object('allowed', online_on),
    'samples', jsonb_build_object(
      'enabled', s_enabled,
      'entitlement', entitlement,
      'accepted', accepted,
      'rejected', rejected,
      'eligible_ml', eligible_ml,
      'next_threshold_ml', next_ml,
      'ml_per_sample', ml_per,
      'sample_size_ml', app_private.setting_num('samples.sample_size_ml', 5),
      'max_per_order', max_per,
      'allow_duplicates', allow_dup)
  );
end $$;

-- ============================================================ coupons: held from placement, clearer refusals
create or replace function app_private.evaluate_coupon(p_user uuid, c public.coupons, p_lines jsonb)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  eligible numeric;
  discount numeric;
  used_by_me int;
  used_total int;
  held text;
  base jsonb := jsonb_build_object('id', c.id, 'code', c.code, 'kind', c.kind, 'description', c.description, 'expires_at', c.expires_at);
  fail jsonb;
begin
  fail := case
    when c.assigned_user_id is not null and c.assigned_user_id is distinct from p_user then
      jsonb_build_object('reason', 'NOT_FOUND', 'message', 'This code isn''t valid.')
    when not c.is_active then jsonb_build_object('reason', 'INACTIVE', 'message', 'This code is no longer active.')
    when c.starts_at is not null and c.starts_at > now() then
      jsonb_build_object('reason', 'NOT_STARTED', 'message', 'This code works from ' || app_private.ist_date(c.starts_at) || '.')
    when c.expires_at is not null and c.expires_at <= now() then
      jsonb_build_object('reason', 'EXPIRED', 'message', 'This code expired on ' || app_private.ist_date(c.expires_at) || '.')
    when p_user is null and (c.per_customer_limit is not null or c.first_order_only or c.assigned_user_id is not null) then
      jsonb_build_object('reason', 'SIGN_IN', 'message', 'Sign in to use this code.')
  end;
  if fail is not null then
    return base || fail || jsonb_build_object('ok', false, 'discount', 0);
  end if;

  if p_user is not null and c.per_customer_limit is not null then
    select count(*) into used_by_me from public.coupon_redemptions where coupon_id = c.id and user_id = p_user and released_at is null;
    if used_by_me >= c.per_customer_limit then
      -- Held by one of the shopper's own unpaid online orders: say which, and how to free it.
      select o.order_number into held
      from public.coupon_redemptions r join public.orders o on o.id = r.order_id
      where r.coupon_id = c.id and r.user_id = p_user and r.released_at is null
        and o.payment_method = 'ONLINE' and o.payment_status in ('PENDING', 'FAILED') and o.status = 'PENDING'
      order by r.created_at desc limit 1;
      if held is not null then
        return base || jsonb_build_object('ok', false, 'reason', 'HELD', 'discount', 0, 'held_by', held,
          'message', 'This code is on your unpaid order ' || held || '. Pay for that order from My orders, or cancel it to use the code here.');
      end if;
      return base || jsonb_build_object('ok', false, 'reason', 'ALREADY_USED', 'message', 'You''ve already used this code.', 'discount', 0);
    end if;
  end if;
  if c.usage_limit is not null then
    select count(*) into used_total from public.coupon_redemptions where coupon_id = c.id and released_at is null;
    if used_total >= c.usage_limit then
      return base || jsonb_build_object('ok', false, 'reason', 'FULLY_REDEEMED', 'message', 'This code has been fully redeemed.', 'discount', 0);
    end if;
  end if;
  -- An unpaid online order is not a "first order" yet (it holds the code instead, see above).
  if c.first_order_only and p_user is not null
     and exists (select 1 from public.orders where user_id = p_user and status <> 'CANCELLED' and replacement_for is null
                 and (payment_method = 'COD' or payment_status not in ('PENDING', 'FAILED'))) then
    return base || jsonb_build_object('ok', false, 'reason', 'FIRST_ORDER', 'message', 'This code is for your first order only.', 'discount', 0);
  end if;

  eligible := app_private.coupon_eligible_amount(c.id, p_lines);
  if eligible <= 0 then
    return base || jsonb_build_object('ok', false, 'reason', 'NOTHING_ELIGIBLE', 'message', 'This code doesn''t cover the items in your bag.', 'discount', 0, 'eligible', 0);
  end if;
  if c.min_order > 0 and eligible < c.min_order then
    return base || jsonb_build_object('ok', false, 'reason', 'BELOW_MIN',
      'message', 'This code needs ' || app_private.rupees(c.min_order) || ' of eligible items. Add ' || app_private.rupees(c.min_order - eligible) || ' more.',
      'discount', 0, 'eligible', eligible, 'min_order', c.min_order);
  end if;

  discount := case when c.discount_type = 'PERCENT' then round(eligible * c.value / 100) else c.value end;
  if c.max_discount is not null then discount := least(discount, c.max_discount); end if;
  discount := least(discount, eligible);
  return base || jsonb_build_object('ok', true, 'reason', null, 'discount', discount, 'eligible', eligible,
    'message', c.code || ' applied — you save ' || app_private.rupees(discount) || '.');
end $$;

-- Every order with a coupon takes one use when it is placed (COD and online alike); cancelling releases it.
create or replace function app_private.orders_coupon_redeem()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c public.coupons; used_total int; used_by_me int;
begin
  if new.coupon_id is null then
    return new;
  end if;
  select * into c from public.coupons where id = new.coupon_id for update;
  if c.usage_limit is not null then
    select count(*) into used_total from public.coupon_redemptions where coupon_id = c.id and released_at is null;
    if used_total >= c.usage_limit then
      raise exception 'COUPON_INVALID: % has just been fully redeemed. Remove it to continue.', c.code;
    end if;
  end if;
  if c.per_customer_limit is not null then
    select count(*) into used_by_me from public.coupon_redemptions where coupon_id = c.id and user_id = new.user_id and released_at is null;
    if used_by_me >= c.per_customer_limit then
      raise exception 'COUPON_INVALID: You''ve already used %. Remove it to continue.', c.code;
    end if;
  end if;
  insert into public.coupon_redemptions (coupon_id, user_id, order_id, discount) values (c.id, new.user_id, new.id, new.discount)
  on conflict (order_id) do nothing;
  return new;
end $$;

-- Online orders placed before this migration that are still open take their use now.
insert into public.coupon_redemptions (coupon_id, user_id, order_id, discount)
select o.coupon_id, o.user_id, o.id, o.discount from public.orders o
where o.coupon_id is not null and o.status <> 'CANCELLED'
  and not exists (select 1 from public.coupon_redemptions r where r.order_id = o.id)
on conflict (order_id) do nothing;

-- ============================================================ placing an order: COD limits, first-order phone check
create or replace function public.create_order(
  p_address_id uuid,
  p_items jsonb,
  p_coupon_code text default null,
  p_payment_method text default 'COD',
  p_samples jsonb default '[]'::jsonb,
  p_note text default null,
  p_client_ref uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  pm text := upper(coalesce(nullif(trim(p_payment_method), ''), 'COD'));
  q jsonb;
  addr public.addresses;
  prof public.profiles;
  existing public.orders;
  oid uuid;
  onum text;
  line jsonb;
  pos int := 0;
  note text := nullif(trim(coalesce(p_note, '')), '');
  coupon_ok boolean;
  max_open int := app_private.setting_num('cod.max_open_orders', 0)::int;
  open_cod int;
begin
  if uid is null then
    raise exception 'SIGN_IN_REQUIRED: Please sign in to place your order.';
  end if;
  if p_client_ref is not null then
    select * into existing from public.orders where user_id = uid and client_ref = p_client_ref;
    if found then
      return jsonb_build_object('id', existing.id, 'order_number', existing.order_number, 'total', existing.total,
                                'payment_method', existing.payment_method, 'samples_short', existing.samples_short, 'duplicate', true);
    end if;
  end if;
  select * into addr from public.addresses where id = p_address_id and user_id = uid;
  if not found then
    raise exception 'ADDRESS_REQUIRED: Choose a delivery address.';
  end if;
  if pm not in ('COD', 'ONLINE') then
    raise exception 'PAYMENT_METHOD: Choose how you''d like to pay.';
  end if;
  if pm = 'ONLINE' and not app_private.setting_bool('payments.online_enabled', false) then
    raise exception 'PAYMENT_UNAVAILABLE: Online payment isn''t available right now. Choose cash on delivery.';
  end if;
  if note is not null and length(note) > 500 then
    raise exception 'NOTE_TOO_LONG: Keep the note under 500 characters.';
  end if;

  q := app_private.quote(uid, p_items, p_coupon_code, pm, p_samples);
  if jsonb_array_length(q -> 'problems') > 0 then
    raise exception 'OUT_OF_STOCK: %', q -> 'problems' -> 0 ->> 'message';
  end if;
  if jsonb_array_length(q -> 'lines') = 0 then
    raise exception 'EMPTY_BAG: Your bag is empty.';
  end if;
  coupon_ok := coalesce((q -> 'coupon' ->> 'ok')::boolean, false);
  if q -> 'coupon' is not null and jsonb_typeof(q -> 'coupon') = 'object' and not coupon_ok then
    raise exception 'COUPON_INVALID: % Remove it to continue.', q -> 'coupon' ->> 'message';
  end if;
  if pm = 'COD' and not (q -> 'cod' ->> 'allowed')::boolean then
    raise exception 'COD_UNAVAILABLE: %', q -> 'cod' ->> 'message';
  end if;
  if pm = 'COD' and max_open > 0 then
    select count(*) into open_cod from public.orders
    where user_id = uid and payment_method = 'COD' and status in ('PENDING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY');
    if open_cod >= max_open then
      raise exception 'COD_LIMIT: You already have % cash-on-delivery orders on the way. %', open_cod,
        case when app_private.setting_bool('payments.online_enabled', false)
             then 'Pay online for this one, or order again once one of them arrives.'
             else 'Please order again once one of them arrives.' end;
    end if;
  end if;
  -- First-order offers: the phone number on the address must be new to the store too.
  if coupon_ok and app_private.setting_bool('coupons.first_order_phone_check', true)
     and exists (select 1 from public.coupons where id = nullif(q -> 'coupon' ->> 'id', '')::uuid and first_order_only)
     and exists (select 1 from public.orders
                 where customer_phone = addr.phone and user_id is distinct from uid and status <> 'CANCELLED' and replacement_for is null
                   and (payment_method = 'COD' or payment_status not in ('PENDING', 'FAILED'))) then
    raise exception 'COUPON_INVALID: % is a first-order offer, and the phone number on this address has ordered with us before. Remove the code to continue.',
      q -> 'coupon' ->> 'code';
  end if;
  if pm = 'ONLINE' and (q ->> 'total')::numeric < 1 then
    raise exception 'PAYMENT_AMOUNT: Online payment needs a total of at least ₹1.';
  end if;

  select * into prof from public.profiles where id = uid;
  onum := coalesce(nullif(app_private.setting('orders.prefix') #>> '{}', ''), 'SAU-') || nextval('public.order_number_seq');

  perform set_config('app.order_write', 'on', true);
  insert into public.orders (
    order_number, user_id, client_ref, status, payment_method, payment_status, subtotal, discount, shipping_fee, total,
    coupon_code, coupon_id, note, customer_name, customer_email, customer_phone, shipping_address, ship_pincode, ship_state, ship_city,
    samples_entitled, sample_picks)
  values (
    onum, uid, p_client_ref, 'PENDING', pm, 'PENDING', (q ->> 'subtotal')::numeric, (q ->> 'discount')::numeric,
    (q ->> 'shipping')::numeric, (q ->> 'total')::numeric,
    case when coupon_ok then q -> 'coupon' ->> 'code' end,
    case when coupon_ok then nullif(q -> 'coupon' ->> 'id', '')::uuid end,
    note, addr.full_name, coalesce(prof.email, (select email from auth.users where id = uid)), addr.phone,
    jsonb_build_object('full_name', addr.full_name, 'phone', addr.phone, 'line1', addr.line1, 'line2', addr.line2,
                       'landmark', addr.landmark, 'city', addr.city, 'state', addr.state, 'pincode', addr.pincode, 'label', addr.label),
    addr.pincode, addr.state, addr.city, (q -> 'samples' ->> 'entitlement')::int, coalesce(q -> 'samples' -> 'accepted', '[]'::jsonb))
  returning id into oid;

  for line in select e from jsonb_array_elements(q -> 'lines') e loop
    insert into public.order_items (order_id, line_type, product_id, variant_id, product_name, product_slug, variant_label, sku,
      size_ml, image_url, qty, unit_price, compare_at_price, line_total, hsn_code, gst_rate, position)
    select oid, 'item', p.id, (line ->> 'variant_id')::uuid, p.name, p.slug, line ->> 'label', line ->> 'sku',
      nullif(line ->> 'size_ml', '')::numeric, line ->> 'image', (line ->> 'qty')::int, (line ->> 'unit_price')::numeric,
      nullif(line ->> 'compare_at_price', '')::numeric, (line ->> 'line_total')::numeric, p.hsn_code, p.gst_rate, pos
    from public.products p where p.id = (line ->> 'product_id')::uuid;
    pos := pos + 1;
  end loop;

  insert into public.order_events (order_id, kind, to_status, message, actor_role)
  values (oid, 'created', 'PENDING', case when pm = 'COD' then 'Order placed · Cash on delivery' else 'Order placed · awaiting online payment' end, 'customer');
  perform set_config('app.order_write', 'off', true);

  if pm = 'COD' then
    perform app_private.reserve_order(oid);
  end if;

  delete from public.carts where user_id = uid;

  return jsonb_build_object('id', oid, 'order_number', onum, 'total', (q ->> 'total')::numeric, 'payment_method', pm,
    'samples_short', (select samples_short from public.orders where id = oid), 'duplicate', false);
end $$;

-- ============================================================ refunds: one ledger, reserve before calling Razorpay
drop index if exists public.refunds_one_razorpay_per_order;

-- Recomputes amount_refunded and the payment status from the ledger (PROCESSING counts, FAILED doesn't).
create or replace function app_private.sync_refunded(p_order uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare refunded numeric;
begin
  select coalesce(sum(amount), 0) into refunded from public.refunds where order_id = p_order and status <> 'FAILED';
  perform set_config('app.order_write', 'on', true);
  update public.orders set amount_refunded = refunded,
    payment_status = case when refunded > 0 and refunded >= total then 'REFUNDED'
                          when refunded > 0 then 'PARTIALLY_REFUNDED'
                          when payment_status in ('REFUNDED', 'PARTIALLY_REFUNDED') then 'PAID'
                          else payment_status end
  where id = p_order;
  perform set_config('app.order_write', 'off', true);
end $$;

-- Service role (razorpay-refund): takes the amount out of what's refundable before Razorpay is asked, so two
-- clicks or two admins can never refund more than was paid. finish_refund records Razorpay's answer.
create or replace function public.begin_refund(p_order uuid, p_amount numeric, p_note text, p_actor uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders; remaining numeric; amt numeric; rid uuid;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND: Order not found.';
  end if;
  if o.payment_method <> 'ONLINE' or o.razorpay_payment_id is null or o.payment_status not in ('PAID', 'PARTIALLY_REFUNDED') then
    raise exception 'REFUND_NOT_ALLOWED: Only paid online orders can be refunded through Razorpay. Record cash or UPI refunds from the return.';
  end if;
  remaining := o.total - coalesce(o.amount_refunded, 0);
  if remaining <= 0 then
    raise exception 'REFUND_DONE: This order has already been refunded in full.';
  end if;
  amt := round(coalesce(p_amount, remaining), 2);
  if amt < 1 or amt > remaining then
    raise exception 'REFUND_AMOUNT: Enter an amount from ₹1 to %.', app_private.rupees(remaining);
  end if;
  insert into public.refunds (order_id, method, amount, status, reference, note, created_by)
  values (p_order, 'RAZORPAY', amt, 'PROCESSING', o.razorpay_payment_id, nullif(trim(coalesce(p_note, '')), ''), p_actor)
  returning id into rid;
  perform app_private.sync_refunded(p_order);
  insert into public.order_events (order_id, kind, message, actor, actor_role)
  values (p_order, 'refund', 'Online refund of ' || app_private.rupees(amt) || ' started', p_actor, case when p_actor is null then 'system' else 'admin' end);
  return jsonb_build_object('refund_id', rid, 'amount', amt, 'payment_id', o.razorpay_payment_id, 'order_number', o.order_number);
end $$;

create or replace function public.finish_refund(p_refund uuid, p_razorpay_refund_id text, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.refunds;
begin
  if p_status not in ('PROCESSING', 'REFUNDED', 'FAILED') then
    raise exception 'REFUND_STATUS: Unknown refund status.';
  end if;
  update public.refunds set
    razorpay_refund_id = coalesce(nullif(p_razorpay_refund_id, ''), razorpay_refund_id),
    -- A webhook can land before the API answer: never move a finished refund back to processing.
    status = case when status in ('REFUNDED', 'FAILED') and p_status = 'PROCESSING' then status else p_status end,
    note = case when nullif(trim(coalesce(p_note, '')), '') is null then note else concat_ws(' · ', note, trim(p_note)) end
  where id = p_refund
  returning * into r;
  if not found then
    return;
  end if;
  perform app_private.sync_refunded(r.order_id);
  if r.status = 'FAILED' then
    insert into public.order_events (order_id, kind, message, actor_role)
    values (r.order_id, 'refund', 'Online refund of ' || app_private.rupees(r.amount) || ' failed' || coalesce(' · ' || nullif(trim(coalesce(p_note, '')), ''), ''), 'system');
  end if;
end $$;

-- Webhook / status check by Razorpay's refund id. Returns false when the refund isn't known (yet).
drop function if exists public.update_refund_status(text, text);
create function public.update_refund_status(p_razorpay_refund_id text, p_status text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare rid uuid;
begin
  select id into rid from public.refunds where razorpay_refund_id = p_razorpay_refund_id;
  if rid is null then
    return false;
  end if;
  perform public.finish_refund(rid, null, p_status, null);
  return true;
end $$;

-- Manual refunds (UPI / bank) and the automatic refund of a payment that couldn't be used.
create or replace function public.record_refund(p_order uuid, p_method text, p_amount numeric, p_status text, p_razorpay_refund_id text, p_reference text, p_note text, p_actor uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare o public.orders; rid uuid;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND: Order not found.';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > o.total - coalesce(o.amount_refunded, 0) + 0.005 then
    raise exception 'REFUND_AMOUNT: Enter an amount from ₹1 to %.', app_private.rupees(o.total - coalesce(o.amount_refunded, 0));
  end if;
  insert into public.refunds (order_id, method, amount, status, razorpay_refund_id, reference, note, created_by)
  values (p_order, p_method, p_amount, p_status, p_razorpay_refund_id, p_reference, p_note, p_actor)
  returning id into rid;
  perform app_private.sync_refunded(p_order);
  insert into public.order_events (order_id, kind, message, actor, actor_role)
  values (p_order, 'refund', 'Refund ' || app_private.rupees(p_amount) || ' · ' || lower(p_status), p_actor, case when p_actor is null then 'system' else 'admin' end);
  return rid;
end $$;

-- Refunds page: notes for any refund; status by hand only for manual (UPI / bank) refunds.
create or replace function public.update_refund(p_refund uuid, p_status text, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.refunds;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN: Only admins can change refunds.'; end if;
  if p_status not in ('PROCESSING', 'REFUNDED', 'FAILED') then raise exception 'REFUND_STATUS: Choose a status.'; end if;
  select * into r from public.refunds where id = p_refund for update;
  if not found then raise exception 'REFUND_NOT_FOUND: Refund not found.'; end if;
  if r.method = 'RAZORPAY' and p_status <> r.status then
    raise exception 'REFUND_STATUS: Razorpay sets the status of online refunds. Use "Check status" to refresh it.';
  end if;
  update public.refunds set status = p_status, note = nullif(trim(coalesce(p_note, '')), '') where id = p_refund;
  perform app_private.sync_refunded(r.order_id);
end $$;

-- Paid online orders that were cancelled or came back (RTO) and still have money to give back.
create or replace function public.refunds_due()
returns table (order_id uuid, order_number text, customer_name text, status text, due numeric, since timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can see this.';
  end if;
  return query
    select o.id, o.order_number, o.customer_name, o.status, o.total - coalesce(o.amount_refunded, 0), coalesce(o.cancelled_at, o.rto_at, o.updated_at)
    from public.orders o
    where o.payment_method = 'ONLINE' and o.payment_status in ('PAID', 'PARTIALLY_REFUNDED') and o.status in ('CANCELLED', 'RTO')
      and o.total - coalesce(o.amount_refunded, 0) > 0
    order by 6 desc;
end $$;

-- Cancelling a paid online order tells the admin and (by default) refunds it in full through razorpay-refund.
create or replace function app_private.orders_refund_on_cancel()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  due numeric := new.total - coalesce(new.amount_refunded, 0);
  auto boolean := app_private.setting_bool('payments.auto_refund_on_cancel', true);
  base text := app_private.setting('shipping.functions_url') #>> '{}';
  secret text;
begin
  if new.status <> 'CANCELLED' or old.status = 'CANCELLED' or new.payment_method <> 'ONLINE'
     or new.payment_status not in ('PAID', 'PARTIALLY_REFUNDED') or due <= 0 then
    return new;
  end if;
  perform app_private.notify_admin('refund', 'Refund due · ' || new.order_number,
    app_private.rupees(due) || case when auto then ' · refunding automatically' else ' · refund it from the order page' end,
    '/admin/orders/' || new.id);
  if not auto or not exists (select 1 from pg_extension where extname = 'pg_net') then
    return new;
  end if;
  begin
    select decrypted_secret into secret from vault.decrypted_secrets where name = 'shipping_hook_secret';
  exception when others then
    secret := null;
  end;
  if secret is null or base is null then
    return new;
  end if;
  perform net.http_post(
    url := base || '/razorpay-refund',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-hook-secret', secret),
    body := jsonb_build_object('action', 'auto', 'order_id', new.id));
  return new;
exception when others then
  return new;  -- the refund stays listed as due; never block a cancellation
end $$;
drop trigger if exists orders_refund_on_cancel on public.orders;
create trigger orders_refund_on_cancel after update of status on public.orders for each row execute function app_private.orders_refund_on_cancel();

-- ============================================================ rate limits: real client IP, internal calls exempt
create or replace function app_private.caller_key()
returns text language sql stable security definer set search_path = '' as $$
  -- sb-forwarded-for / cf-connecting-ip are set by Supabase's edge; the first X-Forwarded-For value is
  -- whatever the caller sent, so it is only a last resort (its last value is the closest proxy's view).
  with h as (select nullif(current_setting('request.headers', true), '')::json as j)
  select coalesce(
    auth.uid()::text,
    'ip:' || coalesce(
      nullif(trim(split_part((select j ->> 'sb-forwarded-for' from h), ',', 1)), ''),
      nullif(trim((select j ->> 'cf-connecting-ip' from h)), ''),
      nullif(trim(reverse(split_part(reverse(coalesce((select j ->> 'x-forwarded-for' from h), '')), ',', 1))), '')),
    'anon')
$$;

create or replace function app_private.rate_limit_trigger()
returns trigger language plpgsql security definer set search_path = '' as $$
declare max_hits int := tg_argv[0]::int; win int := tg_argv[1]::int;
begin
  -- Admins, edge functions (service role) and internal jobs (no request) are never limited.
  if current_setting('request.headers', true) is null or coalesce(auth.role(), '') = 'service_role' or public.is_admin() then
    return new;
  end if;
  perform app_private.check_rate_limit(tg_table_name || ':' || app_private.caller_key(), max_hits, win);
  return new;
end $$;

-- ============================================================ dashboard: refunds due + store setup checklist
create or replace function public.admin_dashboard(p_days int default 30)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  days int := least(366, greatest(1, coalesce(p_days, 30)));
  since timestamptz := date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata' - make_interval(days => days - 1);
  low int := app_private.setting_num('inventory.low_stock_threshold', 5)::int;
  warnings jsonb := '[]'::jsonb;
  setup jsonb;
  brand jsonb := coalesce((select value from public.site_blocks where key = 'brand'), '{}'::jsonb);
  due_n int;
  due_amt numeric;
  stuck int;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can see this.';
  end if;

  if not app_private.setting_bool('cod.enabled', false) and not app_private.setting_bool('payments.online_enabled', false) then
    warnings := warnings || jsonb_build_object('level', 'critical', 'text', 'Checkout is paused: cash on delivery and online payment are both off.', 'link', '/admin/settings');
  end if;
  select count(*), coalesce(sum(due), 0) into due_n, due_amt from public.refunds_due();
  if due_n > 0 then
    warnings := warnings || jsonb_build_object('level', 'critical',
      'text', due_n || case when due_n = 1 then ' cancelled or returned online order still needs a refund (' else ' cancelled or returned online orders still need refunds (' end
              || app_private.rupees(due_amt) || ').', 'link', '/admin/refunds');
  end if;
  select count(*) into stuck from public.refunds where status = 'PROCESSING' and method = 'RAZORPAY' and created_at < now() - interval '7 days';
  if stuck > 0 then
    warnings := warnings || jsonb_build_object('level', 'serious', 'text', stuck || ' online refund(s) have been processing for over a week. Check their status.', 'link', '/admin/refunds');
  end if;
  if exists (select 1 from public.orders where status = 'PACKED' and shipping_error is not null) then
    warnings := warnings || jsonb_build_object('level', 'serious', 'text', 'A courier booking failed. Open the order and retry.', 'link', '/admin/orders?status=PACKED');
  end if;
  if app_private.setting_bool('samples.enabled', false) and not exists (
    select 1 from public.product_variants v join public.products p on p.id = v.product_id
    where v.kind = 'sample' and v.in_sample_pool and v.is_active and not v.is_hidden and v.stock > 0 and p.is_active and p.archived_at is null) then
    warnings := warnings || jsonb_build_object('level', 'warning', 'text', 'The free sample list is empty, so orders go out without samples.', 'link', '/admin/samples');
  end if;
  if coalesce(app_private.setting('business.gstin') #>> '{}', '') = '' then
    warnings := warnings || jsonb_build_object('level', 'warning', 'text', 'Add your GSTIN and business address before printing invoices.', 'link', '/admin/settings');
  end if;

  -- What's left before launch; each item links to the page that finishes it.
  setup := jsonb_build_array(
    jsonb_build_object('key', 'business', 'label', 'Business details for invoices', 'hint', 'Legal name, GSTIN, registered address and state.',
      'link', '/admin/settings',
      'done', coalesce(app_private.setting('business.legal_name') #>> '{}', '') <> '' and coalesce(app_private.setting('business.gstin') #>> '{}', '') <> ''
              and coalesce(app_private.setting('business.address') #>> '{}', '') <> ''),
    jsonb_build_object('key', 'contact', 'label', 'Real support phone and email', 'hint', 'Shown in the footer, on the contact page and on invoices.',
      'link', '/admin/site',
      'done', coalesce(brand ->> 'support_email', '') ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' and coalesce(brand ->> 'support_email', '') !~* '\.example$'
              and coalesce(brand ->> 'support_phone', '') <> ''),
    jsonb_build_object('key', 'products', 'label', 'Your own products', 'hint', 'Replace or archive the sample products that came with the store.',
      'link', '/admin/products',
      'done', not exists (select 1 from public.products where archived_at is null and is_active and admin_note ilike 'SAMPLE PRODUCT%')),
    jsonb_build_object('key', 'policies', 'label', 'Shipping, returns, privacy and terms pages', 'hint', 'They still contain placeholder text.',
      'link', '/admin/pages',
      'done', not exists (select 1 from public.pages where is_published and body::text ilike '%Placeholder —%')),
    jsonb_build_object('key', 'delivery', 'label', 'Delivery fee and couriers checked', 'hint', 'Fee, free-delivery threshold, couriers and blocked pincodes.',
      'link', '/admin/shipping',
      'done', exists (select 1 from public.settings where (key like 'shipping.%' or key like 'cod.%') and updated_by is not null)),
    jsonb_build_object('key', 'sample_coupon', 'label', 'Example coupon removed', 'hint', 'SAMPLE10 came with the store. Edit or delete it.',
      'link', '/admin/coupons',
      'done', not exists (select 1 from public.coupons where admin_note ilike 'SAMPLE coupon%')),
    jsonb_build_object('key', 'samples', 'label', 'Free sample list filled', 'hint', 'The 5 ml vials customers can choose from.',
      'link', '/admin/samples',
      'done', not app_private.setting_bool('samples.enabled', false) or exists (
        select 1 from public.product_variants v join public.products p on p.id = v.product_id
        where v.kind = 'sample' and v.in_sample_pool and v.is_active and not v.is_hidden and v.stock > 0 and p.is_active and p.archived_at is null))
  );

  return jsonb_build_object(
    'days', days,
    'kpis', (
      select jsonb_build_object(
        'revenue', coalesce(sum(total), 0),
        'orders', count(*),
        'aov', case when count(*) > 0 then round(sum(total) / count(*)) else 0 end
      )
      from public.orders where created_at >= since and status <> 'CANCELLED' and replacement_for is null
        and (payment_method = 'COD' or payment_status not in ('PENDING', 'FAILED'))
    ) || jsonb_build_object(
      'pending', (select count(*) from public.orders where status = 'PENDING' and (payment_method = 'COD' or payment_status = 'PAID')),
      'unpaid', (select count(*) from public.orders where status = 'PENDING' and payment_method = 'ONLINE' and payment_status in ('PENDING', 'FAILED')),
      'to_ship', (select count(*) from public.orders where status = 'PACKED'),
      'customers', (select count(*) from public.profiles p where not exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'admin')),
      'new_customers', (select count(*) from public.profiles p where p.created_at >= since and not exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'admin')),
      'low_stock', (select count(*) from public.product_variants v join public.products p on p.id = v.product_id
                    where v.is_active and not v.is_hidden and p.archived_at is null and v.stock <= low),
      'returns_waiting', (select count(*) from public.returns where status = 'REQUESTED'),
      'reviews_waiting', (select count(*) from public.reviews where status = 'PENDING'),
      'refunds_due', due_n
    ),
    'series', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'revenue', coalesce(x.revenue, 0), 'orders', coalesce(x.orders, 0)) order by d), '[]'::jsonb)
      from generate_series((since at time zone 'Asia/Kolkata')::date, (now() at time zone 'Asia/Kolkata')::date, interval '1 day') d
      left join (
        select (created_at at time zone 'Asia/Kolkata')::date as day, sum(total) as revenue, count(*) as orders
        from public.orders where created_at >= since and status <> 'CANCELLED' and replacement_for is null
          and (payment_method = 'COD' or payment_status not in ('PENDING', 'FAILED')) group by 1
      ) x on x.day = d::date
    ),
    'cities', (
      select coalesce(jsonb_agg(jsonb_build_object('label', ship_city, 'orders', n, 'revenue', rev) order by rev desc), '[]'::jsonb)
      from (select initcap(trim(ship_city)) as ship_city, count(*) n, sum(total) rev from public.orders
            where created_at >= since and status <> 'CANCELLED' and replacement_for is null and ship_city is not null
              and (payment_method = 'COD' or payment_status not in ('PENDING', 'FAILED')) group by 1 order by 3 desc limit 10) c
    ),
    'states', (
      select coalesce(jsonb_agg(jsonb_build_object('label', ship_state, 'orders', n, 'revenue', rev) order by rev desc), '[]'::jsonb)
      from (select ship_state, count(*) n, sum(total) rev from public.orders
            where created_at >= since and status <> 'CANCELLED' and replacement_for is null
              and (payment_method = 'COD' or payment_status not in ('PENDING', 'FAILED')) group by 1 order by 3 desc limit 8) s
    ),
    'products', (
      select coalesce(jsonb_agg(jsonb_build_object('label', name, 'units', units, 'revenue', rev, 'id', product_id) order by rev desc), '[]'::jsonb)
      from (select i.product_id, max(i.product_name) as name, sum(i.qty) units, sum(i.line_total) rev
            from public.order_items i join public.orders o on o.id = i.order_id
            where o.created_at >= since and o.status <> 'CANCELLED' and i.line_type = 'item'
              and (o.payment_method = 'COD' or o.payment_status not in ('PENDING', 'FAILED')) group by 1 order by 4 desc limit 10) p
    ),
    'notes', (
      select coalesce(jsonb_agg(jsonb_build_object('label', name, 'revenue', rev) order by rev desc), '[]'::jsonb)
      from (select n.name, sum(i.line_total) rev
            from public.order_items i join public.orders o on o.id = i.order_id
            join public.product_notes pn on pn.product_id = i.product_id join public.notes n on n.id = pn.note_id
            where o.created_at >= since and o.status <> 'CANCELLED' and i.line_type = 'item'
              and (o.payment_method = 'COD' or o.payment_status not in ('PENDING', 'FAILED')) group by 1 order by 2 desc limit 10) t
    ),
    'warnings', warnings,
    'setup', setup
  );
end $$;

-- ============================================================ storage: no public listing of buckets
-- Public buckets serve files by URL without any policy; a SELECT policy only adds the ability to list them.
drop policy if exists saudagar_media_read on storage.objects;
drop policy if exists saudagar_media_admin_read on storage.objects;
create policy saudagar_media_admin_read on storage.objects for select to authenticated
  using (bucket_id in ('media', 'reviews') and (select public.is_admin()));
drop policy if exists saudagar_reviews_own_read on storage.objects;
create policy saudagar_reviews_own_read on storage.objects for select to authenticated
  using (bucket_id = 'reviews' and (storage.foldername(name))[1] = (select auth.uid())::text);

do $$
declare p record; q text; c text;
begin
  for p in select policyname, qual, with_check from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'saudagar_%' loop
    q := replace(replace(p.qual, 'auth.uid()', '(select auth.uid())'), 'is_admin()', '(select public.is_admin())');
    c := replace(replace(p.with_check, 'auth.uid()', '(select auth.uid())'), 'is_admin()', '(select public.is_admin())');
    if p.qual is not null and p.qual !~* 'select' then
      execute format('alter policy %I on storage.objects using (%s)', p.policyname, q);
    end if;
    if p.with_check is not null and p.with_check !~* 'select' then
      execute format('alter policy %I on storage.objects with check (%s)', p.policyname, c);
    end if;
  end loop;
end $$;

-- ============================================================ RLS: evaluate auth.uid()/is_admin() once per query
do $$
declare p record; q text; c text;
begin
  for p in select tablename, policyname, qual, with_check from pg_policies where schemaname = 'public' loop
    q := replace(replace(p.qual, 'auth.uid()', '(select auth.uid())'), 'is_admin()', '(select public.is_admin())');
    c := replace(replace(p.with_check, 'auth.uid()', '(select auth.uid())'), 'is_admin()', '(select public.is_admin())');
    if p.qual is not null and q <> p.qual then
      execute format('alter policy %I on public.%I using (%s)', p.policyname, p.tablename, q);
    end if;
    if p.with_check is not null and c <> p.with_check then
      execute format('alter policy %I on public.%I with check (%s)', p.policyname, p.tablename, c);
    end if;
  end loop;
end $$;

-- One permissive policy per action: where a FOR ALL policy sits next to a FOR SELECT policy, split the ALL
-- policy into insert/update/delete and fold its read condition into the SELECT policy.
do $$
declare a record; s record; readq text;
begin
  for a in
    select pa.tablename, pa.policyname, pa.qual, pa.with_check, pa.roles
    from pg_policies pa
    where pa.schemaname = 'public' and pa.cmd = 'ALL' and pa.permissive = 'PERMISSIVE'
      and exists (select 1 from pg_policies ps where ps.schemaname = 'public' and ps.tablename = pa.tablename and ps.cmd = 'SELECT' and ps.permissive = 'PERMISSIVE')
  loop
    for s in select policyname, qual from pg_policies where schemaname = 'public' and tablename = a.tablename and cmd = 'SELECT' and permissive = 'PERMISSIVE' loop
      readq := s.qual;
      if position(a.qual in s.qual) = 0 then
        readq := '(' || s.qual || ') or (' || a.qual || ')';
        execute format('alter policy %I on public.%I using (%s)', s.policyname, a.tablename, readq);
      end if;
    end loop;
    execute format('drop policy %I on public.%I', a.policyname, a.tablename);
    execute format('create policy %I on public.%I for insert to authenticated with check (%s)', a.policyname || '_ins', a.tablename, coalesce(a.with_check, a.qual));
    execute format('create policy %I on public.%I for update to authenticated using (%s) with check (%s)', a.policyname || '_upd', a.tablename, a.qual, coalesce(a.with_check, a.qual));
    execute format('create policy %I on public.%I for delete to authenticated using (%s)', a.policyname || '_del', a.tablename, a.qual);
  end loop;
end $$;

-- ============================================================ an index for every foreign key
do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass as tbl, c.conname, a.attname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f' and n.nspname = 'public' and array_length(c.conkey, 1) = 1
      and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1])
  loop
    execute format('create index if not exists %I on %s (%I)', left(r.conname, 59) || '_ix', r.tbl, r.attname);
  end loop;
end $$;

-- ============================================================ pg_net out of the public schema
do $$
begin
  if exists (select 1 from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pg_net' and n.nspname = 'public') then
    drop extension pg_net;
    create extension pg_net schema extensions;
  end if;
exception when others then
  raise notice 'pg_net could not be moved (%); it keeps working where it is.', sqlerrm;
end $$;

-- ============================================================ privileges
-- Visitors (anon) never write tables directly: every public write goes through a function.
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
alter default privileges for role postgres in schema public revoke insert, update, delete, truncate, references, trigger on tables from anon;
alter default privileges for role postgres in schema public revoke truncate, references, trigger on tables from authenticated;

-- SECURITY DEFINER functions run with the owner's rights, so each is callable only by who needs it.
-- (Trigger functions need no EXECUTE grant to fire.) supabase/tests/0024_hardening.sql keeps this list honest.
do $$
declare f record;
  visitor text[] := array['is_admin', 'product_is_visible', 'page_is_published', 'site_bootstrap', 'quote_order', 'sample_pool',
    'available_coupons', 'check_pincode', 'product_reviews', 'request_back_in_stock', 'subscribe_newsletter'];
  customer text[] := array['create_order', 'cancel_order', 'my_wishlist', 'set_wishlist', 'reviewable_items', 'submit_review',
    'vote_review', 'request_return', 'set_return_tracking'];
  admin text[] := array['adjust_stock', 'admin_customers', 'admin_dashboard', 'archive_product', 'birthday_customers',
    'create_replacement_order', 'create_sample_variant', 'delete_product', 'duplicate_product', 'duplicate_section',
    'mark_return_refunded', 'moderate_review', 'receive_return', 'refund_return_manually', 'release_birthday_coupons',
    'reorder_collection_products', 'reorder_rows', 'review_return', 'save_coupon', 'save_product', 'set_customer_birthday',
    'set_order_status', 'ship_order', 'update_refund', 'update_return', 'refunds_due'];
begin
  for f in
    select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
    if f.proname = any (visitor) then
      execute format('grant execute on function %s to anon, authenticated', f.sig);
    elsif f.proname = any (customer) or f.proname = any (admin) then
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
