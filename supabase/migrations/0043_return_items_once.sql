-- Returns: each bought line may be listed once, with a whole number of bottles no larger than was bought.
-- Before this, the same line listed twice passed the per-line check, and receiving the return restocked it twice.

create or replace function public.request_return(p_order uuid, p_reason text, p_details text, p_items jsonb, p_media jsonb default '[]'::jsonb)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
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
  -- One entry per bought line: listing a line twice would ask back more than was bought.
  if (select count(distinct e ->> 'order_item_id') from jsonb_array_elements(p_items) e) <> jsonb_array_length(p_items) then
    raise exception 'RETURN_ITEMS: Check the items and quantities.';
  end if;
  for it in select e from jsonb_array_elements(p_items) e loop
    if coalesce(it ->> 'qty', '') !~ '^[0-9]{1,4}$' or coalesce(it ->> 'order_item_id', '') !~* '^[0-9a-f-]{36}$' then
      raise exception 'RETURN_ITEMS: Check the items and quantities.';
    end if;
    select qty into ordered from public.order_items where id = (it ->> 'order_item_id')::uuid and order_id = p_order and line_type = 'item';
    if ordered is null or (it ->> 'qty')::int < 1 or (it ->> 'qty')::int > ordered then
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
end $function$;

revoke all on function public.request_return(uuid, text, text, jsonb, jsonb) from public, anon;
grant execute on function public.request_return(uuid, text, text, jsonb, jsonb) to authenticated;
