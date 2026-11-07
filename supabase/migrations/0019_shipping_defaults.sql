-- 0019_shipping_defaults: the store sells cash on delivery, so the default courier must accept COD.
-- Default = a manual courier (the admin enters any courier's tracking number). India Post stays prepaid-only
-- until its COD contract is confirmed.
update public.settings set value = '"other"'::jsonb where key = 'shipping.default_courier' and value = '"india_post"'::jsonb;
update public.settings
set value = (
  select jsonb_agg(case when e ->> 'key' = 'other' then e || '{"name":"Manual courier"}'::jsonb else e end)
  from jsonb_array_elements(value) e)
where key = 'shipping.couriers';
