-- 0014_sample_weighting: "Surprise me" samples are chosen at random, weighted by stock.
-- A scent with 40 vials is picked about four times as often as one with 10, so stock drains evenly.
-- Scents already in the bag or already given in this order are still avoided first.
-- create_order also records the coupon id (used by the coupon programme).

create or replace function app_private.pick_sample(p_used uuid[], p_bag_products uuid[], p_allow_dup boolean)
returns uuid language sql volatile security definer set search_path = '' as $$
  select v.id
  from public.product_variants v join public.products p on p.id = v.product_id
  where v.kind = 'sample' and v.in_sample_pool and v.is_active and not v.is_hidden and v.stock > 0
    and p.is_active and p.archived_at is null
    and (p_allow_dup or not (v.id = any (coalesce(p_used, '{}'))))
  order by
    (v.product_id = any (coalesce(p_bag_products, '{}'))),
    (v.id = any (coalesce(p_used, '{}'))),
    -ln(1 - random()) / v.stock
  limit 1
  for update of v
$$;

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
    coupon_code, coupon_id, note, customer_name, customer_email, customer_phone, shipping_address, ship_pincode, ship_state, ship_city,
    samples_entitled)
  values (
    onum, uid, p_client_ref, 'PENDING', pm, 'PENDING', (q ->> 'subtotal')::numeric, (q ->> 'discount')::numeric,
    (q ->> 'shipping')::numeric, (q ->> 'total')::numeric,
    case when coalesce((q -> 'coupon' ->> 'ok')::boolean, false) then q -> 'coupon' ->> 'code' end,
    case when coalesce((q -> 'coupon' ->> 'ok')::boolean, false) then nullif(q -> 'coupon' ->> 'id', '')::uuid end,
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
      chosen := app_private.pick_sample(used, bag_products, allow_dup);
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
