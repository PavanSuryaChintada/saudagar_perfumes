-- 0040_integrations_ready: everything the courier, payment and analytics connections need before their keys arrive.
--
-- * A packed order is booked automatically only with ITS courier, and only when that courier's connection is on
--   (before, any packed order went to Delhivery once Delhivery was on).
-- * The admin can change an order's courier until it has a tracking number (chosen when packing).
-- * India Post has its own switch for when its business API is connected (off until then).
-- * Meta Pixel ID next to the Google Analytics IDs.
-- * integration_readiness(): what is set up and what is missing, for Admin → Connections. Never returns secrets.

insert into public.settings (key, value, is_public, description) values
  ('indiapost.enabled', 'false', false, 'Book India Post parcels automatically (needs the India Post business API)'),
  ('analytics.meta_pixel_id', '""', true, 'Meta (Facebook/Instagram) Pixel ID')
on conflict (key) do nothing;

create or replace function app_private.courier_automatic(p_courier text)
returns boolean language sql stable security definer set search_path = '' as $$
  select case p_courier
    when 'delhivery' then app_private.setting_bool('delhivery.enabled', false)
    when 'india_post' then app_private.setting_bool('indiapost.enabled', false)
    else false end
$$;

create or replace function app_private.orders_on_packed()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  base text := app_private.setting('shipping.functions_url') #>> '{}';
  secret text;
begin
  if new.status <> 'PACKED' or old.status = 'PACKED' or new.tracking_number is not null
     or not app_private.courier_automatic(new.courier) then
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

-- Pick the courier for an order before it is booked (e.g. India Post for one parcel when Delhivery is the default).
create or replace function public.set_order_courier(p_order uuid, p_courier text)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.orders; c jsonb;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can change orders.';
  end if;
  select * into o from public.orders where id = p_order;
  if not found then
    raise exception 'ORDER_NOT_FOUND: That order no longer exists.';
  end if;
  select x into c from jsonb_array_elements(coalesce(app_private.setting('shipping.couriers'), '[]'::jsonb)) x where x ->> 'key' = p_courier;
  if c is null then
    raise exception 'COURIER_UNKNOWN: Choose a courier from the list.';
  end if;
  if o.tracking_number is not null or o.status not in ('PENDING', 'PACKED') then
    raise exception 'COURIER_LOCKED: This order is already booked with its courier.';
  end if;
  if o.payment_method = 'COD' and o.payment_status <> 'PAID' and not coalesce((c ->> 'cod_allowed')::boolean, true) then
    raise exception 'COURIER_NO_COD: % doesn''t collect cash on delivery. Choose another courier for this COD order.', coalesce(c ->> 'name', p_courier);
  end if;
  perform set_config('app.order_write', 'on', true);
  update public.orders set courier = p_courier, courier_name = coalesce(c ->> 'name', p_courier) where id = p_order;
  perform set_config('app.order_write', 'off', true);
end $$;
revoke all on function public.set_order_courier(uuid, text) from public, anon;
grant execute on function public.set_order_courier(uuid, text) to authenticated;

-- What is connected and what is missing (Admin → Connections). Secrets themselves are never returned.
create or replace function public.integration_readiness()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can see connections.';
  end if;
  return jsonb_build_object(
    'hook_secret', exists (select 1 from vault.secrets where name = 'shipping_hook_secret'),
    'functions_url', app_private.setting('shipping.functions_url') #>> '{}',
    'online_payments', app_private.setting_bool('payments.online_enabled', false),
    'delhivery_enabled', app_private.setting_bool('delhivery.enabled', false),
    'delhivery_mode', coalesce(app_private.setting('delhivery.mode') #>> '{}', 'staging'),
    'delhivery_pickup_location', coalesce(app_private.setting('delhivery.pickup_location') #>> '{}', ''),
    'indiapost_enabled', app_private.setting_bool('indiapost.enabled', false),
    'status_updates', coalesce(app_private.setting('shipping.status_updates') #>> '{}', 'webhook'),
    'default_courier', coalesce(app_private.setting('shipping.default_courier') #>> '{}', ''),
    'ga4_id', coalesce(app_private.setting('analytics.ga4_id') #>> '{}', ''),
    'gtm_id', coalesce(app_private.setting('analytics.gtm_id') #>> '{}', ''),
    'meta_pixel_id', coalesce(app_private.setting('analytics.meta_pixel_id') #>> '{}', ''),
    'cron', exists (select 1 from pg_extension where extname = 'pg_cron'),
    'pg_net', exists (select 1 from pg_extension where extname = 'pg_net'));
end $$;
revoke all on function public.integration_readiness() from public, anon;
grant execute on function public.integration_readiness() to authenticated;
