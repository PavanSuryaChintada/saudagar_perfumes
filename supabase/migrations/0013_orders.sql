-- 0013_orders: saved bags, the server-side quote (prices, free samples, shipping, COD), cash-on-delivery
-- orders, cancellations with restocking, the order status machine and admin sample-vial helpers.

-- ============================================================ settings used here
insert into public.settings (key, value, is_public, description) values
  ('samples.bag_heading', '"Your free samples"', true, 'Heading above the sample picker in the bag'),
  ('samples.bag_text', '"Every 50 ml of perfume earns a free 5 ml sample. Pick your scents or let us surprise you."', true, 'Helper text under the sample heading in the bag'),
  ('business.legal_name', '""', false, 'Legal business name printed on invoices'),
  ('business.gstin', '""', false, 'GSTIN printed on invoices'),
  ('business.address', '""', false, 'Registered address printed on invoices'),
  ('business.state', '""', false, 'State of registration. Same state as the delivery = CGST + SGST, otherwise IGST'),
  ('business.invoice_note', '""', false, 'Small print at the bottom of invoices')
on conflict (key) do nothing;

create or replace function app_private.setting(p_key text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select value from public.settings where key = p_key
$$;

create or replace function app_private.setting_num(p_key text, p_default numeric)
returns numeric language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(app_private.setting(p_key) #>> '{}', '')::numeric, p_default)
$$;

create or replace function app_private.setting_bool(p_key text, p_default boolean)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(app_private.setting(p_key) #>> '{}', '')::boolean, p_default)
$$;

-- ============================================================ saved bags
create table if not exists public.carts (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  samples jsonb not null default '[]'::jsonb check (jsonb_typeof(samples) = 'array'),
  coupon_code text,
  note text check (note is null or length(note) <= 500),
  updated_at timestamptz not null default now()
);
alter table public.carts enable row level security;
drop policy if exists carts_own on public.carts;
create policy carts_own on public.carts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists carts_admin_read on public.carts;
create policy carts_admin_read on public.carts for select to authenticated using (public.is_admin());
drop trigger if exists carts_updated_at on public.carts;
create trigger carts_updated_at before update on public.carts for each row execute function public.set_updated_at();

-- ============================================================ orders
create sequence if not exists public.order_number_seq start 100001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  client_ref uuid,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RTO')),
  payment_method text not null check (payment_method in ('COD', 'ONLINE')),
  payment_status text not null default 'PENDING'
    check (payment_status in ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED')),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  shipping_fee numeric(12, 2) not null default 0 check (shipping_fee >= 0),
  total numeric(12, 2) not null check (total >= 0),
  amount_refunded numeric(12, 2) not null default 0 check (amount_refunded >= 0),
  coupon_code text,
  coupon_id uuid,
  note text,
  customer_name text,
  customer_email text,
  customer_phone text,
  shipping_address jsonb not null,
  ship_pincode text not null,
  ship_state text not null,
  ship_city text,
  samples_entitled int not null default 0,
  samples_short int not null default 0,
  courier_name text,
  tracking_number text,
  tracking_url text,
  admin_note text,
  cancel_reason text,
  cancelled_by text check (cancelled_by is null or cancelled_by in ('customer', 'admin')),
  stock_restored_at timestamptz,
  packed_at timestamptz,
  shipped_at timestamptz,
  out_for_delivery_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  rto_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_ref)
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists orders_created_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  line_type text not null default 'item' check (line_type in ('item', 'sample')),
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  product_slug text,
  variant_label text,
  sku text,
  size_ml numeric(6, 1),
  image_url text,
  qty int not null check (qty > 0),
  unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  compare_at_price numeric(12, 2),
  line_total numeric(12, 2) not null default 0 check (line_total >= 0),
  hsn_code text,
  gst_rate numeric(5, 2),
  sample_auto boolean not null default false,
  position int not null default 0
);
create index if not exists order_items_order_idx on public.order_items (order_id, position);
create index if not exists order_items_variant_idx on public.order_items (variant_id);

create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  kind text not null check (kind in ('created', 'status', 'cancelled', 'note', 'tracking', 'payment')),
  from_status text,
  to_status text,
  message text,
  actor uuid default auth.uid() references auth.users (id) on delete set null,
  actor_role text check (actor_role is null or actor_role in ('customer', 'admin', 'system')),
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

-- Money, status and stock fields change only inside the order functions (app.order_write = 'on').
-- Admins may edit notes and tracking details directly.
create or replace function public.orders_guard()
returns trigger language plpgsql set search_path = '' as $$
declare free_cols text[] := array['admin_note', 'courier_name', 'tracking_number', 'tracking_url', 'updated_at'];
begin
  if coalesce(current_setting('app.order_write', true), '') <> 'on'
     and (to_jsonb(new) - free_cols) is distinct from (to_jsonb(old) - free_cols) then
    raise exception 'ORDER_DIRECT_WRITE: Orders change through their actions (status, cancel), not directly.';
  end if;
  return new;
end $$;
drop trigger if exists orders_guard on public.orders;
create trigger orders_guard before update on public.orders for each row execute function public.orders_guard();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_items_read on public.order_items;
create policy order_items_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
drop policy if exists order_events_read on public.order_events;
create policy order_events_read on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
drop policy if exists order_events_admin_insert on public.order_events;
create policy order_events_admin_insert on public.order_events for insert to authenticated
  with check (public.is_admin() and kind in ('note', 'tracking'));

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

-- ============================================================ coupons hook (phase 5 replaces this)
create or replace function app_private.coupon_quote(p_user uuid, p_code text, p_subtotal numeric, p_lines jsonb)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if nullif(trim(coalesce(p_code, '')), '') is null then
    return null;
  end if;
  return jsonb_build_object('ok', false, 'code', upper(trim(p_code)), 'reason', 'NOT_FOUND', 'message', 'This code isn''t valid.', 'discount', 0);
end $$;

-- ============================================================ the quote
-- p_items: [{variant_id, qty}]  p_samples: [variant_id | null (= surprise me)]
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
  shipping := case when jsonb_array_length(lines) = 0 then 0
                   when threshold > 0 and after_discount >= threshold then 0
                   else fee end;
  total := after_discount + shipping;

  cod_reason := case when not cod_enabled then 'COD_OFF'
                     when cod_min > 0 and total < cod_min then 'COD_MIN' end;

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
      'message', case cod_reason when 'COD_OFF' then 'Cash on delivery is not available right now.'
                                 when 'COD_MIN' then 'Cash on delivery is available on orders of ₹' || trim(to_char(cod_min, 'FM99,99,99,990')) || ' or more.' end),
    'online', jsonb_build_object('allowed', app_private.setting_bool('payments.online_enabled', false)),
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

create or replace function public.quote_order(p_items jsonb, p_coupon_code text default null, p_payment_method text default 'COD', p_samples jsonb default '[]'::jsonb)
returns jsonb language sql stable security definer set search_path = '' as $$
  select app_private.quote(auth.uid(), p_items, p_coupon_code, p_payment_method, p_samples)
$$;
grant execute on function public.quote_order(jsonb, text, text, jsonb) to anon, authenticated;

-- Scents a customer can pick as free samples.
create or replace function public.sample_pool()
returns table (variant_id uuid, product_id uuid, name text, slug text, label text, image text, family text)
language sql stable security definer set search_path = '' as $$
  select v.id, p.id, p.name, p.slug, v.label,
    (select m.url from public.product_media m where m.product_id = p.id and m.kind = 'image' order by m.position limit 1),
    (select o.label from public.product_attributes pa join public.attribute_options o on o.id = pa.option_id
      where pa.product_id = p.id and o.kind = 'family' order by pa.is_primary desc limit 1)
  from public.product_variants v join public.products p on p.id = v.product_id
  where v.kind = 'sample' and v.in_sample_pool and v.is_active and not v.is_hidden and v.stock > 0
    and p.is_active and p.archived_at is null
  order by v.position, p.name
$$;
grant execute on function public.sample_pool() to anon, authenticated;

-- ============================================================ placing an order
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
  slots int;
  pick text;
  chosen uuid;
  short int := 0;
  used uuid[] := '{}';
  bag_products uuid[];
  allow_dup boolean := app_private.setting_bool('samples.allow_duplicates', true);
  note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if uid is null then
    raise exception 'SIGN_IN_REQUIRED: Please sign in to place your order.';
  end if;
  if p_client_ref is not null then
    select * into existing from public.orders where user_id = uid and client_ref = p_client_ref;
    if found then
      return jsonb_build_object('id', existing.id, 'order_number', existing.order_number, 'total', existing.total,
                                'samples_short', existing.samples_short, 'duplicate', true);
    end if;
  end if;
  select * into addr from public.addresses where id = p_address_id and user_id = uid;
  if not found then
    raise exception 'ADDRESS_REQUIRED: Choose a delivery address.';
  end if;
  if pm not in ('COD', 'ONLINE') then
    raise exception 'PAYMENT_METHOD: Choose how you''d like to pay.';
  end if;
  if pm = 'ONLINE' then
    raise exception 'PAYMENT_UNAVAILABLE: Online payment isn''t available yet. Choose cash on delivery.';
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
  if q -> 'coupon' is not null and jsonb_typeof(q -> 'coupon') = 'object' and not coalesce((q -> 'coupon' ->> 'ok')::boolean, false) then
    raise exception 'COUPON_INVALID: % Remove it to continue.', q -> 'coupon' ->> 'message';
  end if;
  if pm = 'COD' and not (q -> 'cod' ->> 'allowed')::boolean then
    raise exception 'COD_UNAVAILABLE: %', q -> 'cod' ->> 'message';
  end if;

  select * into prof from public.profiles where id = uid;
  onum := coalesce(nullif(app_private.setting('orders.prefix') #>> '{}', ''), 'SAU-') || nextval('public.order_number_seq');

  perform set_config('app.order_write', 'on', true);
  insert into public.orders (
    order_number, user_id, client_ref, status, payment_method, payment_status, subtotal, discount, shipping_fee, total,
    coupon_code, note, customer_name, customer_email, customer_phone, shipping_address, ship_pincode, ship_state, ship_city,
    samples_entitled)
  values (
    onum, uid, p_client_ref, 'PENDING', pm, 'PENDING', (q ->> 'subtotal')::numeric, (q ->> 'discount')::numeric,
    (q ->> 'shipping')::numeric, (q ->> 'total')::numeric,
    case when coalesce((q -> 'coupon' ->> 'ok')::boolean, false) then q -> 'coupon' ->> 'code' end,
    note, addr.full_name, coalesce(prof.email, (select email from auth.users where id = uid)), addr.phone,
    jsonb_build_object('full_name', addr.full_name, 'phone', addr.phone, 'line1', addr.line1, 'line2', addr.line2,
                       'landmark', addr.landmark, 'city', addr.city, 'state', addr.state, 'pincode', addr.pincode, 'label', addr.label),
    addr.pincode, addr.state, addr.city, (q -> 'samples' ->> 'entitlement')::int)
  returning id into oid;

  for line in select e from jsonb_array_elements(q -> 'lines') e loop
    perform app_private.apply_stock_change((line ->> 'variant_id')::uuid, -(line ->> 'qty')::int, 'order', oid, null);
    insert into public.order_items (order_id, line_type, product_id, variant_id, product_name, product_slug, variant_label, sku,
      size_ml, image_url, qty, unit_price, compare_at_price, line_total, hsn_code, gst_rate, position)
    select oid, 'item', p.id, (line ->> 'variant_id')::uuid, p.name, p.slug, line ->> 'label', line ->> 'sku',
      nullif(line ->> 'size_ml', '')::numeric, line ->> 'image', (line ->> 'qty')::int, (line ->> 'unit_price')::numeric,
      nullif(line ->> 'compare_at_price', '')::numeric, (line ->> 'line_total')::numeric, p.hsn_code, p.gst_rate, pos
    from public.products p where p.id = (line ->> 'product_id')::uuid;
    pos := pos + 1;
  end loop;

  -- Sales counters (derived fields).
  perform set_config('app.derived_write', 'on', true);
  update public.product_variants v set units_sold = v.units_sold + x.qty
  from (select (e ->> 'variant_id')::uuid as id, (e ->> 'qty')::int as qty from jsonb_array_elements(q -> 'lines') e) x
  where v.id = x.id;
  update public.products p set units_sold = p.units_sold + x.qty
  from (select (e ->> 'product_id')::uuid as id, sum((e ->> 'qty')::int)::int as qty from jsonb_array_elements(q -> 'lines') e group by 1) x
  where p.id = x.id;
  perform set_config('app.derived_write', 'off', true);

  -- Free samples: honour each pick if it is still in stock, otherwise choose one; never block the order.
  slots := coalesce((q -> 'samples' ->> 'entitlement')::int, 0);
  select coalesce(array_agg((e ->> 'product_id')::uuid), '{}') into bag_products from jsonb_array_elements(q -> 'lines') e;
  for i in 1..slots loop
    chosen := null;
    pick := q -> 'samples' -> 'accepted' ->> (i - 1);
    if pick is not null then
      select v.id into chosen
      from public.product_variants v join public.products p on p.id = v.product_id
      where v.id = pick::uuid and v.kind = 'sample' and v.in_sample_pool and v.is_active and not v.is_hidden and v.stock > 0
        and p.is_active and p.archived_at is null and (allow_dup or not (v.id = any (used)))
      for update of v;
    end if;
    if chosen is null then
      select v.id into chosen
      from public.product_variants v join public.products p on p.id = v.product_id
      where v.kind = 'sample' and v.in_sample_pool and v.is_active and not v.is_hidden and v.stock > 0
        and p.is_active and p.archived_at is null and (allow_dup or not (v.id = any (used)))
      order by (v.product_id = any (bag_products)), (v.id = any (used)), v.stock desc, v.position
      limit 1
      for update of v;
    end if;
    if chosen is null then
      short := short + 1;
      continue;
    end if;
    perform app_private.apply_stock_change(chosen, -1, 'order', oid, 'Free sample');
    used := used || chosen;
    insert into public.order_items (order_id, line_type, product_id, variant_id, product_name, product_slug, variant_label, sku,
      size_ml, image_url, qty, unit_price, line_total, hsn_code, gst_rate, sample_auto, position)
    select oid, 'sample', p.id, v.id, p.name, p.slug, v.label, v.sku, v.size_ml,
      (select m.url from public.product_media m where m.product_id = p.id and m.kind = 'image' order by m.position limit 1),
      1, 0, 0, p.hsn_code, p.gst_rate, (pick is null or pick::uuid <> v.id), pos
    from public.product_variants v join public.products p on p.id = v.product_id where v.id = chosen;
    pos := pos + 1;
  end loop;

  update public.orders set samples_short = short where id = oid;
  insert into public.order_events (order_id, kind, to_status, message, actor_role)
  values (oid, 'created', 'PENDING', 'Order placed · Cash on delivery', 'customer');
  perform set_config('app.order_write', 'off', true);

  delete from public.carts where user_id = uid;

  return jsonb_build_object('id', oid, 'order_number', onum, 'total', (q ->> 'total')::numeric, 'samples_short', short, 'duplicate', false);
end $$;
revoke execute on function public.create_order(uuid, jsonb, text, text, jsonb, text, uuid) from anon;
grant execute on function public.create_order(uuid, jsonb, text, text, jsonb, text, uuid) to authenticated;

-- ============================================================ status machine
create or replace function public.order_transition_allowed(p_from text, p_to text, p_payment_method text, p_payment_status text)
returns boolean language sql immutable set search_path = '' as $$
  select case p_from
    when 'PENDING' then p_to = 'CANCELLED' or (p_to = 'PACKED' and (p_payment_method = 'COD' or p_payment_status = 'PAID'))
    when 'PACKED' then p_to in ('SHIPPED', 'CANCELLED')
    when 'SHIPPED' then p_to in ('OUT_FOR_DELIVERY', 'DELIVERED', 'RTO')
    when 'OUT_FOR_DELIVERY' then p_to in ('DELIVERED', 'RTO')
    else false
  end
$$;
grant execute on function public.order_transition_allowed(text, text, text, text) to authenticated;

create or replace function app_private.cancel_order_internal(p_order uuid, p_by text, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.orders; it record;
begin
  select * into o from public.orders where id = p_order for update;
  if o.status = 'CANCELLED' then return; end if;
  perform set_config('app.order_write', 'on', true);
  if o.stock_restored_at is null then
    for it in select variant_id, qty, line_type from public.order_items where order_id = p_order and variant_id is not null loop
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
    cancel_reason = nullif(trim(coalesce(p_reason, '')), ''), stock_restored_at = coalesce(stock_restored_at, now())
  where id = p_order;
  insert into public.order_events (order_id, kind, from_status, to_status, message, actor_role)
  values (p_order, 'cancelled', o.status, 'CANCELLED',
          case when p_by = 'customer' then 'Cancelled by the customer' else 'Cancelled by the store' end
          || coalesce(' · ' || nullif(trim(coalesce(p_reason, '')), ''), ''), p_by);
  perform set_config('app.order_write', 'off', true);
end $$;

create or replace function public.cancel_order(p_order uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.orders; admin boolean := public.is_admin();
begin
  select * into o from public.orders where id = p_order for update;
  if not found or (o.user_id is distinct from auth.uid() and not admin) then
    raise exception 'ORDER_NOT_FOUND: We couldn''t find that order.';
  end if;
  if o.status = 'CANCELLED' then
    return;
  end if;
  if not admin and o.status <> 'PENDING' then
    raise exception 'CANCEL_TOO_LATE: This order is already being prepared, so it can''t be cancelled here. Contact us and we''ll help.';
  end if;
  if admin and o.status not in ('PENDING', 'PACKED') then
    raise exception 'CANCEL_TOO_LATE: This order has left the store. Mark it as returned to origin (RTO) instead.';
  end if;
  perform app_private.cancel_order_internal(p_order, case when o.user_id = auth.uid() then 'customer' else 'admin' end, p_reason);
end $$;
grant execute on function public.cancel_order(uuid, text) to authenticated;

create or replace function public.set_order_status(p_order uuid, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can change order status.';
  end if;
  select * into o from public.orders where id = p_order for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND: We couldn''t find that order.';
  end if;
  if o.status = p_status then
    return;
  end if;
  if not public.order_transition_allowed(o.status, p_status, o.payment_method, o.payment_status) then
    raise exception 'STATUS_NOT_ALLOWED: An order can''t move from % to %.', o.status, p_status;
  end if;
  if p_status = 'CANCELLED' then
    perform app_private.cancel_order_internal(p_order, 'admin', p_note);
    return;
  end if;
  perform set_config('app.order_write', 'on', true);
  update public.orders set
    status = p_status,
    packed_at = case when p_status = 'PACKED' then now() else packed_at end,
    shipped_at = case when p_status = 'SHIPPED' then now() else shipped_at end,
    out_for_delivery_at = case when p_status = 'OUT_FOR_DELIVERY' then now() else out_for_delivery_at end,
    delivered_at = case when p_status = 'DELIVERED' then now() else delivered_at end,
    rto_at = case when p_status = 'RTO' then now() else rto_at end,
    payment_status = case when p_status = 'DELIVERED' and payment_method = 'COD' then 'PAID' else payment_status end,
    paid_at = case when p_status = 'DELIVERED' and payment_method = 'COD' then now() else paid_at end
  where id = p_order;
  insert into public.order_events (order_id, kind, from_status, to_status, message, actor_role)
  values (p_order, 'status', o.status, p_status, nullif(trim(coalesce(p_note, '')), ''), 'admin');
  perform set_config('app.order_write', 'off', true);
end $$;
grant execute on function public.set_order_status(uuid, text, text) to authenticated;

-- ============================================================ admin helpers for sample vials
create or replace function public.create_sample_variant(p_product uuid, p_size_ml numeric default null, p_stock int default 0)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  prod public.products;
  size numeric := coalesce(p_size_ml, app_private.setting_num('samples.sample_size_ml', 5));
  base_sku text;
  new_sku text;
  n int := 1;
  vid uuid;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can change products.';
  end if;
  select * into prod from public.products where id = p_product;
  if not found then
    raise exception 'PRODUCT_NOT_FOUND: That product no longer exists.';
  end if;
  if exists (select 1 from public.product_variants where product_id = p_product and kind = 'sample' and not is_hidden) then
    raise exception 'SAMPLE_EXISTS: % already has a sample vial.', prod.name;
  end if;
  base_sku := upper(regexp_replace(prod.slug, '[^a-z0-9]+', '-', 'gi')) || '-S' || trim_scale(size)::text;
  new_sku := base_sku;
  while exists (select 1 from public.product_variants where sku = new_sku) loop
    n := n + 1;
    new_sku := base_sku || '-' || n;
  end loop;
  insert into public.product_variants (product_id, kind, sku, size_ml, label, price, stock, is_active, is_hidden, in_sample_pool, position)
  values (p_product, 'sample', new_sku, size, trim_scale(size)::text || ' ml sample', 0, 0, true, false, true,
          coalesce((select max(position) + 1 from public.product_variants where kind = 'sample'), 0))
  returning id into vid;
  if coalesce(p_stock, 0) > 0 then
    perform app_private.apply_stock_change(vid, p_stock, 'restock', null, 'First stock for the sample vial');
  end if;
  return vid;
end $$;
grant execute on function public.create_sample_variant(uuid, numeric, int) to authenticated;
