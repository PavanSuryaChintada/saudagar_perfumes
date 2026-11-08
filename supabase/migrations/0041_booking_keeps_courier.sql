-- 0041_booking_keeps_courier: a booked parcel keeps the courier chosen for its order (not always Delhivery).

create or replace function public.save_shipment_booking(p_order uuid, p_awb text, p_courier_order_id text, p_label_url text, p_pickup timestamptz, p_error text)
returns void language plpgsql security definer set search_path = '' as $$
declare c jsonb; tpl text; ck text;
begin
  perform set_config('app.order_write', 'on', true);
  if p_error is not null then
    update public.orders set shipping_error = left(p_error, 500), shipping_synced_at = now() where id = p_order;
  else
    -- The parcel keeps the courier chosen for the order (Delhivery, or India Post once connected).
    select coalesce(nullif(courier, ''), 'delhivery') into ck from public.orders where id = p_order;
    select e into c from jsonb_array_elements(coalesce(app_private.setting('shipping.couriers'), '[]'::jsonb)) e where e ->> 'key' = ck;
    tpl := c ->> 'tracking_url';
    update public.orders set courier = ck, courier_name = coalesce(c ->> 'name', ck), tracking_number = p_awb,
      tracking_url = case when tpl ~* '^https?://' then replace(tpl, '{awb}', p_awb) end,
      courier_order_id = p_courier_order_id, label_url = p_label_url, pickup_scheduled_at = p_pickup,
      shipping_error = null, shipping_synced_at = now()
    where id = p_order;
  end if;
  perform set_config('app.order_write', 'off', true);
end $$;
