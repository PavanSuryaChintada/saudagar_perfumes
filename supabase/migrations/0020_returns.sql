-- 0020_returns: return requests (damaged, leaking, wrong or missing items) within the return window,
-- admin review, pickup or post-back, restock or write-off on arrival, and resolution by refund
-- (Razorpay for online, manual UPI/bank for COD) or a ₹0 replacement order.

insert into public.settings (key, value, is_public, description) values
  ('returns.policy_text', '"We accept returns within 7 days of delivery for items that arrive damaged, leaking or wrong, or when something is missing. Add photos so we can sort it out quickly."', true, 'Shown on the return request form')
on conflict (key) do nothing;

create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'REQUESTED'
    check (status in ('REQUESTED', 'APPROVED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'RECEIVED', 'REFUNDED', 'REPLACED', 'REJECTED')),
  reason text not null check (reason in ('DAMAGED', 'LEAKING', 'WRONG_ITEM', 'MISSING_ITEM')),
  details text check (details is null or length(details) <= 1000),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  media jsonb not null default '[]'::jsonb check (jsonb_typeof(media) = 'array' and jsonb_array_length(media) <= 3),
  customer_note text,
  internal_note text,
  return_method text check (return_method is null or return_method in ('PICKUP', 'POST', 'NOT_NEEDED')),
  return_courier text,
  return_tracking text,
  stock_decision text check (stock_decision is null or stock_decision in ('RESTOCK', 'WRITE_OFF')),
  resolution text check (resolution is null or resolution in ('REFUND', 'REPLACE')),
  refund_amount numeric(12, 2),
  replacement_order_id uuid references public.orders (id) on delete set null,
  approved_at timestamptz,
  rejected_at timestamptz,
  received_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists returns_status_idx on public.returns (status, created_at desc);
drop trigger if exists returns_updated_at on public.returns;
create trigger returns_updated_at before update on public.returns for each row execute function public.set_updated_at();
alter table public.returns enable row level security;
drop policy if exists returns_read on public.returns;
create policy returns_read on public.returns for select to authenticated using (user_id = auth.uid() or public.is_admin());

alter table public.orders add column if not exists replacement_for uuid references public.orders (id) on delete set null;

create or replace function app_private.return_owned(p_return uuid, p_admin boolean)
returns public.returns language plpgsql security definer set search_path = '' as $$
declare r public.returns;
begin
  select * into r from public.returns where id = p_return for update;
  if not found or (not p_admin and r.user_id is distinct from auth.uid()) or (p_admin and not public.is_admin()) then
    raise exception 'RETURN_NOT_FOUND: We couldn''t find that return.';
  end if;
  return r;
end $$;

-- ============================================================ customer
create or replace function public.request_return(p_order uuid, p_reason text, p_details text, p_items jsonb, p_media jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  window_days int := app_private.setting_num('returns.window_days', 7)::int;
  rid uuid;
  it jsonb;
  ordered int;
  m text;
begin
  select * into o from public.orders where id = p_order;
  if not found or o.user_id is distinct from auth.uid() then
    raise exception 'ORDER_NOT_FOUND: We couldn''t find that order.';
  end if;
  if o.status <> 'DELIVERED' or o.delivered_at is null then
    raise exception 'RETURN_NOT_ALLOWED: Returns open once the order is delivered.';
  end if;
  if o.delivered_at < now() - make_interval(days => window_days) then
    raise exception 'RETURN_WINDOW: Returns close % days after delivery. Contact us and we''ll help.', window_days;
  end if;
  if exists (select 1 from public.returns where order_id = p_order) then
    raise exception 'RETURN_EXISTS: You''ve already asked for a return on this order.';
  end if;
  if p_reason not in ('DAMAGED', 'LEAKING', 'WRONG_ITEM', 'MISSING_ITEM') then
    raise exception 'RETURN_REASON: Choose what went wrong.';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'RETURN_ITEMS: Choose the items with a problem.';
  end if;
  for it in select e from jsonb_array_elements(p_items) e loop
    select qty into ordered from public.order_items where id = (it ->> 'order_item_id')::uuid and order_id = p_order and line_type = 'item';
    if ordered is null or coalesce((it ->> 'qty')::int, 0) < 1 or (it ->> 'qty')::int > ordered then
      raise exception 'RETURN_ITEMS: Check the items and quantities.';
    end if;
  end loop;
  if jsonb_typeof(coalesce(p_media, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_media, '[]'::jsonb)) > 3 then
    raise exception 'RETURN_MEDIA: Add up to 3 photos or videos.';
  end if;
  for m in select jsonb_array_elements_text(coalesce(p_media, '[]'::jsonb)) loop
    if split_part(m, '/', 1) <> auth.uid()::text then
      raise exception 'RETURN_MEDIA: Upload the photos again.';
    end if;
  end loop;
  insert into public.returns (order_id, user_id, reason, details, items, media)
  values (p_order, auth.uid(), p_reason, nullif(trim(coalesce(p_details, '')), ''), p_items, coalesce(p_media, '[]'::jsonb))
  returning id into rid;
  insert into public.order_events (order_id, kind, message, actor_role) values (p_order, 'note', 'Return requested', 'customer');
  return rid;
end $$;
grant execute on function public.request_return(uuid, text, text, jsonb, jsonb) to authenticated;

create or replace function public.set_return_tracking(p_return uuid, p_courier text, p_tracking text)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.returns := app_private.return_owned(p_return, false);
begin
  if r.status <> 'APPROVED' or r.return_method <> 'POST' then
    raise exception 'RETURN_STATUS: Add the tracking number once the return is approved for posting.';
  end if;
  if nullif(trim(coalesce(p_tracking, '')), '') is null then
    raise exception 'TRACKING_REQUIRED: Enter the article or tracking number.';
  end if;
  update public.returns set return_courier = nullif(trim(coalesce(p_courier, '')), ''), return_tracking = trim(p_tracking), status = 'IN_TRANSIT'
  where id = p_return;
end $$;
grant execute on function public.set_return_tracking(uuid, text, text) to authenticated;

-- ============================================================ admin
create or replace function public.review_return(p_return uuid, p_approve boolean, p_note text, p_method text default 'POST')
returns void language plpgsql security definer set search_path = '' as $$
declare r public.returns := app_private.return_owned(p_return, true);
begin
  if r.status <> 'REQUESTED' then
    raise exception 'RETURN_STATUS: This return was already reviewed.';
  end if;
  if p_approve then
    if p_method not in ('PICKUP', 'POST', 'NOT_NEEDED') then
      raise exception 'RETURN_METHOD: Choose pickup, post, or no return needed.';
    end if;
    update public.returns set status = case when p_method = 'NOT_NEEDED' then 'RECEIVED' else 'APPROVED' end, return_method = p_method,
      customer_note = nullif(trim(coalesce(p_note, '')), ''), approved_at = now(),
      received_at = case when p_method = 'NOT_NEEDED' then now() end,
      stock_decision = case when p_method = 'NOT_NEEDED' then 'WRITE_OFF' end
    where id = p_return;
  else
    if nullif(trim(coalesce(p_note, '')), '') is null then
      raise exception 'RETURN_NOTE: Tell the customer why the return is declined.';
    end if;
    update public.returns set status = 'REJECTED', customer_note = trim(p_note), rejected_at = now() where id = p_return;
  end if;
end $$;
grant execute on function public.review_return(uuid, boolean, text, text) to authenticated;

create or replace function public.update_return(p_return uuid, p_status text, p_courier text default null, p_tracking text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.returns := app_private.return_owned(p_return, true);
begin
  if p_status not in ('PICKUP_SCHEDULED', 'IN_TRANSIT') or r.status not in ('APPROVED', 'PICKUP_SCHEDULED', 'IN_TRANSIT') then
    raise exception 'RETURN_STATUS: That step isn''t possible now.';
  end if;
  update public.returns set status = p_status,
    return_courier = coalesce(nullif(trim(coalesce(p_courier, '')), ''), return_courier),
    return_tracking = coalesce(nullif(trim(coalesce(p_tracking, '')), ''), return_tracking)
  where id = p_return;
end $$;
grant execute on function public.update_return(uuid, text, text, text) to authenticated;

-- Arrived back: restock or write off. Both are logged in the inventory history.
create or replace function public.receive_return(p_return uuid, p_decision text)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.returns := app_private.return_owned(p_return, true); it jsonb; vid uuid; q int; cur int;
begin
  if r.status not in ('APPROVED', 'PICKUP_SCHEDULED', 'IN_TRANSIT') then
    raise exception 'RETURN_STATUS: This return can''t be received now.';
  end if;
  if p_decision not in ('RESTOCK', 'WRITE_OFF') then
    raise exception 'RETURN_DECISION: Choose restock or write off.';
  end if;
  for it in select e from jsonb_array_elements(r.items) e loop
    select variant_id into vid from public.order_items where id = (it ->> 'order_item_id')::uuid;
    q := (it ->> 'qty')::int;
    if vid is null then continue; end if;
    if p_decision = 'RESTOCK' then
      perform app_private.apply_stock_change(vid, q, 'return_restock', r.order_id, 'Return received in good condition');
    else
      select stock into cur from public.product_variants where id = vid;
      insert into public.inventory_movements (variant_id, delta, stock_after, reason, order_id, note)
      values (vid, 0, cur, 'write_off', r.order_id, q || ' returned unit(s) written off (damaged), not put back on sale');
    end if;
  end loop;
  update public.returns set status = 'RECEIVED', received_at = now(), stock_decision = p_decision where id = p_return;
end $$;
grant execute on function public.receive_return(uuid, text) to authenticated;

-- COD (or any order) refunded by UPI / bank transfer.
create or replace function public.refund_return_manually(p_return uuid, p_amount numeric, p_reference text, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.returns := app_private.return_owned(p_return, true); o public.orders;
begin
  if r.status <> 'RECEIVED' then
    raise exception 'RETURN_STATUS: Receive the return before refunding it.';
  end if;
  select * into o from public.orders where id = r.order_id;
  if p_amount is null or p_amount <= 0 or p_amount > o.total - o.amount_refunded then
    raise exception 'REFUND_AMOUNT: Refund between ₹1 and %.', app_private.rupees(o.total - o.amount_refunded);
  end if;
  if nullif(trim(coalesce(p_reference, '')), '') is null then
    raise exception 'REFUND_REFERENCE: Enter the UPI or bank transfer reference.';
  end if;
  perform public.record_refund(r.order_id, 'MANUAL', p_amount, 'REFUNDED', null, trim(p_reference), p_note, auth.uid());
  update public.returns set status = 'REFUNDED', resolution = 'REFUND', refund_amount = p_amount, resolved_at = now() where id = p_return;
end $$;
grant execute on function public.refund_return_manually(uuid, numeric, text, text) to authenticated;

-- After an online refund through the razorpay-refund function.
create or replace function public.mark_return_refunded(p_return uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.returns := app_private.return_owned(p_return, true); amt numeric;
begin
  if r.status <> 'RECEIVED' then
    raise exception 'RETURN_STATUS: Receive the return before refunding it.';
  end if;
  select coalesce(sum(amount), 0) into amt from public.refunds where order_id = r.order_id and status <> 'FAILED';
  if amt <= 0 then
    raise exception 'REFUND_MISSING: No refund was recorded for this order yet.';
  end if;
  update public.returns set status = 'REFUNDED', resolution = 'REFUND', refund_amount = amt, resolved_at = now() where id = p_return;
end $$;
grant execute on function public.mark_return_refunded(uuid) to authenticated;

-- ₹0 replacement order with the returned items; takes stock and is set to PACKED.
create or replace function public.create_replacement_order(p_return uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  r public.returns := app_private.return_owned(p_return, true);
  o public.orders;
  nid uuid;
  it jsonb;
  pos int := 0;
begin
  if r.status <> 'RECEIVED' then
    raise exception 'RETURN_STATUS: Receive the return before sending a replacement.';
  end if;
  select * into o from public.orders where id = r.order_id;
  perform set_config('app.order_write', 'on', true);
  insert into public.orders (order_number, user_id, status, payment_method, payment_status, subtotal, discount, shipping_fee, total,
    note, customer_name, customer_email, customer_phone, shipping_address, ship_pincode, ship_state, ship_city, samples_entitled,
    replacement_for, paid_at)
  values (coalesce(nullif(app_private.setting('orders.prefix') #>> '{}', ''), 'SAU-') || nextval('public.order_number_seq'), o.user_id, 'PENDING',
    'ONLINE', 'PAID', 0, 0, 0, 0, 'Replacement for ' || o.order_number, o.customer_name, o.customer_email, o.customer_phone,
    o.shipping_address, o.ship_pincode, o.ship_state, o.ship_city, 0, o.id, now())
  returning id into nid;
  for it in select e from jsonb_array_elements(r.items) e loop
    insert into public.order_items (order_id, line_type, product_id, variant_id, product_name, product_slug, variant_label, sku, size_ml,
      image_url, qty, unit_price, line_total, hsn_code, gst_rate, position)
    select nid, 'item', i.product_id, i.variant_id, i.product_name, i.product_slug, i.variant_label, i.sku, i.size_ml, i.image_url,
      (it ->> 'qty')::int, 0, 0, i.hsn_code, i.gst_rate, pos
    from public.order_items i where i.id = (it ->> 'order_item_id')::uuid;
    pos := pos + 1;
  end loop;
  insert into public.order_events (order_id, kind, to_status, message, actor_role)
  values (nid, 'created', 'PENDING', 'Replacement for ' || o.order_number, 'admin');
  perform set_config('app.order_write', 'off', true);
  perform app_private.reserve_order(nid);
  perform public.set_order_status(nid, 'PACKED', 'Replacement ready to ship');
  update public.returns set status = 'REPLACED', resolution = 'REPLACE', replacement_order_id = nid, resolved_at = now() where id = p_return;
  return nid;
end $$;
grant execute on function public.create_replacement_order(uuid) to authenticated;

-- Refunds page: manual status and notes for a refund.
create or replace function public.update_refund(p_refund uuid, p_status text, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.refunds; refunded numeric;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN: Only admins can change refunds.'; end if;
  if p_status not in ('PROCESSING', 'REFUNDED', 'FAILED') then raise exception 'REFUND_STATUS: Choose a status.'; end if;
  update public.refunds set status = p_status, note = nullif(trim(coalesce(p_note, '')), '') where id = p_refund returning * into r;
  if not found then raise exception 'REFUND_NOT_FOUND: Refund not found.'; end if;
  select coalesce(sum(amount), 0) into refunded from public.refunds where order_id = r.order_id and status <> 'FAILED';
  perform set_config('app.order_write', 'on', true);
  update public.orders set amount_refunded = refunded,
    payment_status = case when refunded >= total and total > 0 then 'REFUNDED' when refunded > 0 then 'PARTIALLY_REFUNDED'
                          when payment_status in ('REFUNDED', 'PARTIALLY_REFUNDED') then 'PAID' else payment_status end
  where id = r.order_id;
  perform set_config('app.order_write', 'off', true);
end $$;
grant execute on function public.update_refund(uuid, text, text) to authenticated;
