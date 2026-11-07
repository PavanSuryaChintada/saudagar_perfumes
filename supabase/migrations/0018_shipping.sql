-- 0018_shipping: couriers (manual / India Post by default, Delhivery off until a token exists), pincode
-- serviceability with blocked and COD-blocked lists, shipping columns, manual booking, status updates from
-- the courier, and the hook that books Delhivery shipments when an order is packed.

insert into public.settings (key, value, is_public, description) values
  ('shipping.default_courier', '"india_post"', false, 'Courier used for new shipments (india_post, delhivery or other)'),
  ('shipping.couriers', $q$[
    {"key":"india_post","name":"India Post","tracking_url":"https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx","cod_allowed":false},
    {"key":"delhivery","name":"Delhivery","tracking_url":"https://www.delhivery.com/track/package/{awb}","cod_allowed":true},
    {"key":"other","name":"Other courier","tracking_url":"","cod_allowed":true}
  ]$q$, false, 'Couriers, tracking link templates ({awb}) and whether each collects cash'),
  ('shipping.blocked_pincodes', '[]', false, 'Pincodes we do not deliver to'),
  ('shipping.cod_blocked_pincodes', '[]', false, 'Pincodes where cash on delivery is not offered'),
  ('shipping.surface_extra_days', '2', true, 'Extra delivery days for surface-only (flammable) products'),
  ('shipping.packaging_g', '150', false, 'Packaging weight added to every parcel (grams)'),
  ('shipping.default_item_g', '300', false, 'Weight used for items without their own weight (grams)'),
  ('shipping.default_box', '{"length_mm": 200, "width_mm": 150, "height_mm": 100}', false, 'Box size used when items have none'),
  ('shipping.status_updates', '"webhook"', false, 'How courier status updates arrive: webhook or poll'),
  ('shipping.functions_url', '"https://ijwbzjwpqscekkqgiuzq.supabase.co/functions/v1"', false, 'Base URL of the edge functions (for the packed hook and the poll)'),
  ('delhivery.enabled', 'false', true, 'Book shipments with Delhivery automatically (needs the API token)'),
  ('delhivery.mode', '"staging"', false, 'staging or production'),
  ('delhivery.pickup_location', '""', false, 'Registered pickup location name at Delhivery')
on conflict (key) do nothing;

alter table public.orders add column if not exists courier text;
alter table public.orders add column if not exists courier_order_id text;
alter table public.orders add column if not exists label_url text;
alter table public.orders add column if not exists pickup_scheduled_at timestamptz;
alter table public.orders add column if not exists shipping_status text;
alter table public.orders add column if not exists shipping_error text;
alter table public.orders add column if not exists shipping_synced_at timestamptz;
create index if not exists orders_tracking_idx on public.orders (tracking_number) where tracking_number is not null;

-- ============================================================ serviceability
create or replace function public.check_pincode(p_pincode text, p_surface boolean default false)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  pin text := trim(coalesce(p_pincode, ''));
  blocked jsonb := coalesce(app_private.setting('shipping.blocked_pincodes'), '[]'::jsonb);
  cod_blocked jsonb := coalesce(app_private.setting('shipping.cod_blocked_pincodes'), '[]'::jsonb);
  couriers jsonb := coalesce(app_private.setting('shipping.couriers'), '[]'::jsonb);
  courier text := coalesce(app_private.setting('shipping.default_courier') #>> '{}', 'india_post');
  courier_cod boolean;
  eta jsonb := coalesce(app_private.setting('shipping.default_eta'), '{"min":3,"max":7}'::jsonb);
  extra int := case when p_surface then app_private.setting_num('shipping.surface_extra_days', 0)::int else 0 end;
  cod_on boolean := app_private.setting_bool('cod.enabled', false);
  cod boolean;
begin
  if pin !~ '^[1-9][0-9]{5}$' then
    return jsonb_build_object('valid', false, 'serviceable', false, 'cod', false, 'message', 'Enter a 6-digit pincode.');
  end if;
  if blocked ? pin then
    return jsonb_build_object('valid', true, 'serviceable', false, 'cod', false, 'message', 'Sorry, we don''t deliver to ' || pin || ' yet.');
  end if;
  select coalesce((c ->> 'cod_allowed')::boolean, true) into courier_cod from jsonb_array_elements(couriers) c where c ->> 'key' = courier;
  cod := cod_on and coalesce(courier_cod, true) and not (cod_blocked ? pin);
  return jsonb_build_object(
    'valid', true, 'serviceable', true, 'cod', cod, 'courier', courier,
    'eta_min', coalesce((eta ->> 'min')::int, 3) + extra, 'eta_max', coalesce((eta ->> 'max')::int, 7) + extra,
    'message', 'Delivers in ' || (coalesce((eta ->> 'min')::int, 3) + extra) || '–' || (coalesce((eta ->> 'max')::int, 7) + extra) || ' days'
      || case when cod then ' · Cash on delivery available' else ' · Prepaid only' end || '.');
end $$;
grant execute on function public.check_pincode(text, boolean) to anon, authenticated;

-- Orders can't be placed to blocked pincodes, or as COD where COD isn't offered.
create or replace function app_private.orders_check_pincode()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r jsonb;
begin
  r := public.check_pincode(new.ship_pincode, exists (
    select 1 from public.order_items i join public.products p on p.id = i.product_id where i.order_id = new.id and p.ships_surface_only));
  if not (r ->> 'serviceable')::boolean then
    raise exception 'PINCODE_UNSERVICEABLE: %', r ->> 'message';
  end if;
  if new.payment_method = 'COD' and not (r ->> 'cod')::boolean then
    raise exception 'COD_UNAVAILABLE: Cash on delivery isn''t available for pincode %. Choose online payment.', new.ship_pincode;
  end if;
  new.courier := coalesce(new.courier, r ->> 'courier');
  return new;
end $$;
drop trigger if exists orders_check_pincode on public.orders;
create trigger orders_check_pincode before insert on public.orders for each row execute function app_private.orders_check_pincode();

-- ============================================================ manual booking
create or replace function public.ship_order(p_order uuid, p_courier text, p_tracking text, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  c jsonb;
  awb text := nullif(trim(coalesce(p_tracking, '')), '');
  tpl text;
  url text;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can ship orders.';
  end if;
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND: We couldn''t find that order.'; end if;
  if o.status <> 'PACKED' then
    raise exception 'STATUS_NOT_ALLOWED: Mark the order packed before shipping it.';
  end if;
  if awb is null then
    raise exception 'TRACKING_REQUIRED: Enter the tracking (AWB / article) number.';
  end if;
  select e into c from jsonb_array_elements(coalesce(app_private.setting('shipping.couriers'), '[]'::jsonb)) e where e ->> 'key' = p_courier;
  tpl := c ->> 'tracking_url';
  if tpl ~* '^https?://' then
    url := case when position('{awb}' in tpl) > 0 then replace(tpl, '{awb}', awb) else tpl end;
  end if;
  perform set_config('app.order_write', 'on', true);
  update public.orders set courier = p_courier, courier_name = coalesce(c ->> 'name', p_courier), tracking_number = awb,
    tracking_url = url, shipping_error = null
  where id = p_order;
  perform set_config('app.order_write', 'off', true);
  perform public.set_order_status(p_order, 'SHIPPED', coalesce(nullif(trim(coalesce(p_note, '')), ''), coalesce(c ->> 'name', p_courier) || ' · ' || awb));
end $$;
grant execute on function public.ship_order(uuid, text, text, text) to authenticated;

-- ============================================================ courier status updates (service role)
create or replace function public.apply_shipment_status(p_awb text, p_raw text, p_status text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders; rank_now int; rank_next int;
begin
  select * into o from public.orders where tracking_number = p_awb order by created_at desc limit 1 for update;
  if not found then
    return jsonb_build_object('matched', false);
  end if;
  perform set_config('app.order_write', 'on', true);
  update public.orders set shipping_status = left(p_raw, 120), shipping_synced_at = now() where id = o.id;
  perform set_config('app.order_write', 'off', true);
  rank_now := case o.status when 'PENDING' then 0 when 'PACKED' then 1 when 'SHIPPED' then 2 when 'OUT_FOR_DELIVERY' then 3 else 9 end;
  rank_next := case p_status when 'SHIPPED' then 2 when 'OUT_FOR_DELIVERY' then 3 when 'DELIVERED' then 4 when 'RTO' then 4 else 0 end;
  if p_status is null or rank_next <= rank_now then
    return jsonb_build_object('matched', true, 'changed', false);
  end if;
  -- Walk forward through allowed steps (e.g. PACKED → SHIPPED → DELIVERED).
  if o.status = 'PACKED' and p_status <> 'SHIPPED' then
    perform app_private.courier_move(o.id, 'SHIPPED', p_raw);
  end if;
  perform app_private.courier_move(o.id, p_status, p_raw);
  return jsonb_build_object('matched', true, 'changed', true);
end $$;
revoke execute on function public.apply_shipment_status(text, text, text) from public, anon, authenticated;
grant execute on function public.apply_shipment_status(text, text, text) to service_role;

create or replace function app_private.courier_move(p_order uuid, p_status text, p_raw text)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order for update;
  if not public.order_transition_allowed(o.status, p_status, o.payment_method, o.payment_status) then
    return;
  end if;
  perform set_config('app.order_write', 'on', true);
  update public.orders set
    status = p_status,
    shipped_at = case when p_status = 'SHIPPED' then coalesce(shipped_at, now()) else shipped_at end,
    out_for_delivery_at = case when p_status = 'OUT_FOR_DELIVERY' then now() else out_for_delivery_at end,
    delivered_at = case when p_status = 'DELIVERED' then now() else delivered_at end,
    rto_at = case when p_status = 'RTO' then now() else rto_at end,
    payment_status = case when p_status = 'DELIVERED' and payment_method = 'COD' then 'PAID' else payment_status end,
    paid_at = case when p_status = 'DELIVERED' and payment_method = 'COD' then now() else paid_at end
  where id = p_order;
  insert into public.order_events (order_id, kind, from_status, to_status, message, actor_role)
  values (p_order, 'status', o.status, p_status, 'Courier update · ' || left(coalesce(p_raw, ''), 80), 'system');
  perform set_config('app.order_write', 'off', true);
end $$;

-- Saves what the courier API returned when booking (service role).
create or replace function public.save_shipment_booking(p_order uuid, p_awb text, p_courier_order_id text, p_label_url text, p_pickup timestamptz, p_error text)
returns void language plpgsql security definer set search_path = '' as $$
declare c jsonb; tpl text;
begin
  perform set_config('app.order_write', 'on', true);
  if p_error is not null then
    update public.orders set shipping_error = left(p_error, 500), shipping_synced_at = now() where id = p_order;
  else
    select e into c from jsonb_array_elements(coalesce(app_private.setting('shipping.couriers'), '[]'::jsonb)) e where e ->> 'key' = 'delhivery';
    tpl := c ->> 'tracking_url';
    update public.orders set courier = 'delhivery', courier_name = coalesce(c ->> 'name', 'Delhivery'), tracking_number = p_awb,
      tracking_url = case when tpl ~* '^https?://' then replace(tpl, '{awb}', p_awb) end,
      courier_order_id = p_courier_order_id, label_url = p_label_url, pickup_scheduled_at = p_pickup,
      shipping_error = null, shipping_synced_at = now()
    where id = p_order;
  end if;
  perform set_config('app.order_write', 'off', true);
end $$;
revoke execute on function public.save_shipment_booking(uuid, text, text, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.save_shipment_booking(uuid, text, text, text, timestamptz, text) to service_role;

-- ============================================================ packed → book with Delhivery (when on)
create or replace function app_private.orders_on_packed()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  base text := app_private.setting('shipping.functions_url') #>> '{}';
  secret text;
begin
  if new.status <> 'PACKED' or old.status = 'PACKED' or not app_private.setting_bool('delhivery.enabled', false) then
    return new;
  end if;
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
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
    url := base || '/shipping',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-shipping-secret', secret),
    body := jsonb_build_object('action', 'create', 'order_id', new.id));
  return new;
end $$;
drop trigger if exists orders_on_packed on public.orders;
create trigger orders_on_packed after update of status on public.orders for each row execute function app_private.orders_on_packed();

do $$ begin
  begin
    create extension if not exists pg_net;
  exception when others then
    raise notice 'pg_net is not available.';
  end;
end $$;

-- Poll courier status every 30 minutes when the poll mode is chosen (the function exits early otherwise).
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') and exists (select 1 from pg_extension where extname = 'pg_net') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'shipping-poll';
    perform cron.schedule('shipping-poll', '*/30 * * * *', $cron$
      select net.http_post(
        url := (select value #>> '{}' from public.settings where key = 'shipping.functions_url') || '/shipping',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-shipping-secret',
          coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'shipping_hook_secret'), '')),
        body := '{"action":"poll"}'::jsonb)
      where exists (select 1 from public.settings where key = 'delhivery.enabled' and value = 'true'::jsonb)
        and exists (select 1 from public.settings where key = 'shipping.status_updates' and value = '"poll"'::jsonb)
    $cron$);
  end if;
end $$;
