-- 0017_online_payments: Razorpay (built, off until keys). Online orders are created unpaid and reserve
-- nothing; stock, free samples and the coupon use are taken when the payment is confirmed. Unpaid
-- online orders expire after 24 hours. Refunds are recorded per order.

alter table public.orders add column if not exists razorpay_order_id text;
alter table public.orders add column if not exists razorpay_payment_id text;
alter table public.orders add column if not exists payment_failure_reason text;
alter table public.orders add column if not exists sample_picks jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists stock_reserved_at timestamptz;
create unique index if not exists orders_razorpay_payment_idx on public.orders (razorpay_payment_id) where razorpay_payment_id is not null;
create index if not exists orders_unpaid_online_idx on public.orders (created_at) where payment_method = 'ONLINE' and payment_status <> 'PAID' and status = 'PENDING';

-- Orders placed before this migration were all COD and reserved stock when placed.
do $$ begin
  perform set_config('app.order_write', 'on', true);
  update public.orders set stock_reserved_at = created_at where stock_reserved_at is null and payment_method = 'COD';
  perform set_config('app.order_write', 'off', true);
end $$;

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  method text not null check (method in ('RAZORPAY', 'MANUAL')),
  amount numeric(12, 2) not null check (amount > 0),
  status text not null default 'PROCESSING' check (status in ('PROCESSING', 'REFUNDED', 'FAILED')),
  razorpay_refund_id text unique,
  reference text,
  note text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists refunds_one_razorpay_per_order on public.refunds (order_id) where method = 'RAZORPAY' and status <> 'FAILED';
drop trigger if exists refunds_updated_at on public.refunds;
create trigger refunds_updated_at before update on public.refunds for each row execute function public.set_updated_at();
alter table public.refunds enable row level security;
drop policy if exists refunds_read on public.refunds;
create policy refunds_read on public.refunds for select to authenticated
  using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

alter table public.order_events drop constraint if exists order_events_kind_check;
alter table public.order_events add constraint order_events_kind_check check (kind in ('created', 'status', 'cancelled', 'note', 'tracking', 'payment', 'refund'));

-- ============================================================ taking stock and samples for an order
-- Called once per order: at placement for COD, at payment confirmation for online orders.
create or replace function app_private.reserve_order(p_order uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  it record;
  slots int;
  pick text;
  chosen uuid;
  short int := 0;
  used uuid[] := '{}';
  bag_products uuid[];
  allow_dup boolean := app_private.setting_bool('samples.allow_duplicates', true);
  pos int;
begin
  select * into o from public.orders where id = p_order for update;
  if o.stock_reserved_at is not null then
    return;
  end if;

  for it in select variant_id, qty, product_name, variant_label from public.order_items where order_id = p_order and line_type = 'item' loop
    begin
      perform app_private.apply_stock_change(it.variant_id, -it.qty, 'order', p_order, null);
    exception when others then
      if sqlerrm like 'STOCK_NEGATIVE%' then
        raise exception 'OUT_OF_STOCK: % · % sold out before your order went through.', it.product_name, it.variant_label;
      end if;
      raise;
    end;
  end loop;

  perform set_config('app.derived_write', 'on', true);
  update public.product_variants v set units_sold = v.units_sold + x.qty
  from (select variant_id as id, sum(qty)::int as qty from public.order_items where order_id = p_order and line_type = 'item' group by 1) x
  where v.id = x.id;
  update public.products p set units_sold = p.units_sold + x.qty
  from (select product_id as id, sum(qty)::int as qty from public.order_items where order_id = p_order and line_type = 'item' group by 1) x
  where p.id = x.id;
  perform set_config('app.derived_write', 'off', true);

  -- Free samples: honour each pick if still in stock, otherwise pick by stock weight; never block the order.
  slots := coalesce(o.samples_entitled, 0);
  select coalesce(array_agg(product_id), '{}') into bag_products from public.order_items where order_id = p_order and line_type = 'item';
  select coalesce(max(position) + 1, 0) into pos from public.order_items where order_id = p_order;
  for i in 1..slots loop
    chosen := null;
    pick := o.sample_picks ->> (i - 1);
    if pick is not null and pick ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select v.id into chosen
      from public.product_variants v join public.products p on p.id = v.product_id
      where v.id = pick::uuid and v.kind = 'sample' and v.in_sample_pool and v.is_active and not v.is_hidden and v.stock > 0
        and p.is_active and p.archived_at is null and (allow_dup or not (v.id = any (used)))
      for update of v;
    else
      pick := null;
    end if;
    if chosen is null then
      chosen := app_private.pick_sample(used, bag_products, allow_dup);
    end if;
    if chosen is null then
      short := short + 1;
      continue;
    end if;
    perform app_private.apply_stock_change(chosen, -1, 'order', p_order, 'Free sample');
    used := used || chosen;
    insert into public.order_items (order_id, line_type, product_id, variant_id, product_name, product_slug, variant_label, sku,
      size_ml, image_url, qty, unit_price, line_total, hsn_code, gst_rate, sample_auto, position)
    select p_order, 'sample', p.id, v.id, p.name, p.slug, v.label, v.sku, v.size_ml,
      (select m.url from public.product_media m where m.product_id = p.id and m.kind = 'image' order by m.position limit 1),
      1, 0, 0, p.hsn_code, p.gst_rate, (pick is null or pick::uuid <> v.id), pos
    from public.product_variants v join public.products p on p.id = v.product_id where v.id = chosen;
    pos := pos + 1;
  end loop;

  perform set_config('app.order_write', 'on', true);
  update public.orders set samples_short = short, stock_reserved_at = now() where id = p_order;
  perform set_config('app.order_write', 'off', true);
end $$;

-- ============================================================ placing an order (COD or online)
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
revoke execute on function public.create_order(uuid, jsonb, text, text, jsonb, text, uuid) from anon;
grant execute on function public.create_order(uuid, jsonb, text, text, jsonb, text, uuid) to authenticated;

-- Coupon use: COD at placement (the trigger from 0016), online at payment confirmation (below).
create or replace function app_private.record_coupon_use(p_order uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order;
  if o.coupon_id is null or exists (select 1 from public.coupon_redemptions where order_id = p_order) then
    return;
  end if;
  insert into public.coupon_redemptions (coupon_id, user_id, order_id, discount) values (o.coupon_id, o.user_id, o.id, o.discount);
end $$;

-- ============================================================ payment confirmation (service role only)
create or replace function public.confirm_order_payment(p_order uuid, p_razorpay_order_id text, p_payment_id text, p_amount_paise bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND: Order not found.';
  end if;
  if o.payment_method <> 'ONLINE' then
    raise exception 'PAYMENT_METHOD: This order is not paid online.';
  end if;
  if o.payment_status = 'PAID' then
    if o.razorpay_payment_id = p_payment_id then
      return jsonb_build_object('status', 'already_paid', 'order_number', o.order_number);
    end if;
    raise exception 'ALREADY_PAID: This order was already paid with another payment.';
  end if;
  if o.razorpay_order_id is distinct from p_razorpay_order_id then
    raise exception 'PAYMENT_MISMATCH: The payment does not belong to this order.';
  end if;
  if p_amount_paise <> round(o.total * 100)::bigint then
    raise exception 'PAYMENT_MISMATCH: The amount paid does not match the order.';
  end if;
  if o.status = 'CANCELLED' then
    raise exception 'ORDER_CANCELLED: This order was cancelled before the payment arrived.';
  end if;

  perform app_private.reserve_order(p_order);  -- raises OUT_OF_STOCK; the caller refunds
  perform app_private.record_coupon_use(p_order);
  perform set_config('app.order_write', 'on', true);
  update public.orders set payment_status = 'PAID', paid_at = now(), razorpay_payment_id = p_payment_id, payment_failure_reason = null
  where id = p_order;
  insert into public.order_events (order_id, kind, message, actor_role) values (p_order, 'payment', 'Paid online · ' || p_payment_id, 'system');
  perform set_config('app.order_write', 'off', true);
  return jsonb_build_object('status', 'paid', 'order_number', o.order_number);
end $$;
revoke execute on function public.confirm_order_payment(uuid, text, text, bigint) from public, anon, authenticated;
grant execute on function public.confirm_order_payment(uuid, text, text, bigint) to service_role;

create or replace function public.set_razorpay_order(p_order uuid, p_razorpay_order_id text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('app.order_write', 'on', true);
  update public.orders set razorpay_order_id = p_razorpay_order_id where id = p_order;
  perform set_config('app.order_write', 'off', true);
end $$;
revoke execute on function public.set_razorpay_order(uuid, text) from public, anon, authenticated;
grant execute on function public.set_razorpay_order(uuid, text) to service_role;

create or replace function public.mark_payment_failed(p_order uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('app.order_write', 'on', true);
  update public.orders set payment_status = 'FAILED', payment_failure_reason = left(nullif(trim(coalesce(p_reason, '')), ''), 300)
  where id = p_order and payment_status in ('PENDING', 'FAILED');
  perform set_config('app.order_write', 'off', true);
end $$;
revoke execute on function public.mark_payment_failed(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_payment_failed(uuid, text) to service_role;

create or replace function public.record_refund(p_order uuid, p_method text, p_amount numeric, p_status text, p_razorpay_refund_id text, p_reference text, p_note text, p_actor uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare o public.orders; rid uuid; refunded numeric;
begin
  select * into o from public.orders where id = p_order for update;
  insert into public.refunds (order_id, method, amount, status, razorpay_refund_id, reference, note, created_by)
  values (p_order, p_method, p_amount, p_status, p_razorpay_refund_id, p_reference, p_note, p_actor)
  returning id into rid;
  select coalesce(sum(amount), 0) into refunded from public.refunds where order_id = p_order and status <> 'FAILED';
  perform set_config('app.order_write', 'on', true);
  update public.orders set amount_refunded = refunded,
    payment_status = case when refunded >= total then 'REFUNDED' when refunded > 0 then 'PARTIALLY_REFUNDED' else payment_status end
  where id = p_order;
  insert into public.order_events (order_id, kind, message, actor, actor_role)
  values (p_order, 'refund', 'Refund ' || app_private.rupees(p_amount) || ' · ' || lower(p_status), p_actor, 'admin');
  perform set_config('app.order_write', 'off', true);
  return rid;
end $$;
revoke execute on function public.record_refund(uuid, text, numeric, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.record_refund(uuid, text, numeric, text, text, text, text, uuid) to service_role;

create or replace function public.update_refund_status(p_razorpay_refund_id text, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.refunds; refunded numeric;
begin
  update public.refunds set status = p_status where razorpay_refund_id = p_razorpay_refund_id returning * into r;
  if not found then return; end if;
  select coalesce(sum(amount), 0) into refunded from public.refunds where order_id = r.order_id and status <> 'FAILED';
  perform set_config('app.order_write', 'on', true);
  update public.orders set amount_refunded = refunded,
    payment_status = case when refunded >= total then 'REFUNDED' when refunded > 0 then 'PARTIALLY_REFUNDED' else 'PAID' end
  where id = r.order_id;
  perform set_config('app.order_write', 'off', true);
end $$;
revoke execute on function public.update_refund_status(text, text) from public, anon, authenticated;
grant execute on function public.update_refund_status(text, text) to service_role;

-- ============================================================ cancelling restocks only what was reserved
create or replace function app_private.cancel_order_internal(p_order uuid, p_by text, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.orders; it record;
begin
  select * into o from public.orders where id = p_order for update;
  if o.status = 'CANCELLED' then return; end if;
  perform set_config('app.order_write', 'on', true);
  if o.stock_reserved_at is not null and o.stock_restored_at is null then
    for it in select variant_id, qty from public.order_items where order_id = p_order and variant_id is not null loop
      perform app_private.apply_stock_change(it.variant_id, it.qty, 'cancel_restock', p_order, 'Order ' || o.order_number || ' cancelled');
    end loop;
    perform set_config('app.derived_write', 'on', true);
    update public.product_variants v set units_sold = greatest(0, v.units_sold - x.qty)
    from (select variant_id as id, sum(qty)::int as qty from public.order_items where order_id = p_order and line_type = 'item' and variant_id is not null group by 1) x
    where v.id = x.id;
    update public.products p set units_sold = greatest(0, p.units_sold - x.qty)
    from (select product_id as id, sum(qty)::int as qty from public.order_items where order_id = p_order and line_type = 'item' and product_id is not null group by 1) x
    where p.id = x.id;
    perform set_config('app.derived_write', 'off', true);
  end if;
  update public.orders set status = 'CANCELLED', cancelled_at = now(), cancelled_by = p_by,
    cancel_reason = nullif(trim(coalesce(p_reason, '')), ''),
    stock_restored_at = case when stock_reserved_at is not null then coalesce(stock_restored_at, now()) else stock_restored_at end
  where id = p_order;
  insert into public.order_events (order_id, kind, from_status, to_status, message, actor_role)
  values (p_order, 'cancelled', o.status, 'CANCELLED',
          case when p_by = 'customer' then 'Cancelled by the customer' when p_by = 'system' then 'Cancelled: not paid within 24 hours' else 'Cancelled by the store' end
          || case when o.payment_method = 'ONLINE' and o.payment_status = 'PAID' then ' · refund due' else '' end
          || coalesce(' · ' || nullif(trim(coalesce(p_reason, '')), ''), ''),
          case when p_by = 'system' then 'system' else p_by end);
  perform set_config('app.order_write', 'off', true);
end $$;

alter table public.orders drop constraint if exists orders_cancelled_by_check;
alter table public.orders add constraint orders_cancelled_by_check check (cancelled_by is null or cancelled_by in ('customer', 'admin', 'system'));

-- Online orders not paid within 24 hours are cancelled (nothing was reserved, so nothing to restock).
create or replace function app_private.expire_unpaid_orders()
returns int language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  for r in
    select id from public.orders
    where payment_method = 'ONLINE' and payment_status in ('PENDING', 'FAILED') and status = 'PENDING' and created_at < now() - interval '24 hours'
  loop
    perform app_private.cancel_order_internal(r.id, 'system', null);
    n := n + 1;
  end loop;
  return n;
end $$;

do $$ begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron is not available; expire unpaid orders another way.';
  end;
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'expire-unpaid-orders';
    perform cron.schedule('expire-unpaid-orders', '17 * * * *', 'select app_private.expire_unpaid_orders()');
  end if;
end $$;
