-- 0034_gift_pack_returns: a gift pack returned in good condition puts its perfumes back, and a replacement gift pack
-- carries the same perfumes (taken from stock when the replacement is reserved).

create or replace function public.receive_return(p_return uuid, p_decision text)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.returns := app_private.return_owned(p_return, true); it jsonb; vid uuid; q int; cur int; ch record;
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
      -- A gift pack's perfumes go back with it.
      for ch in select variant_id, qty from public.order_items
                where parent_item_id = (it ->> 'order_item_id')::uuid and line_type = 'pack_item' and variant_id is not null loop
        perform app_private.apply_stock_change(ch.variant_id, ch.qty * q, 'return_restock', r.order_id, 'Gift pack returned in good condition');
      end loop;
    else
      select stock into cur from public.product_variants where id = vid;
      insert into public.inventory_movements (variant_id, delta, stock_after, reason, order_id, note)
      values (vid, 0, cur, 'write_off', r.order_id, q || ' returned unit(s) written off (damaged), not put back on sale');
    end if;
  end loop;
  update public.returns set status = 'RECEIVED', received_at = now(), stock_decision = p_decision where id = p_return;
end $$;

create or replace function public.create_replacement_order(p_return uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  r public.returns := app_private.return_owned(p_return, true);
  o public.orders;
  nid uuid;
  it jsonb;
  pos int := 0;
  new_item uuid;
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
    from public.order_items i where i.id = (it ->> 'order_item_id')::uuid
    returning id into new_item;
    pos := pos + 1;
    -- A replacement gift pack carries the same perfumes.
    insert into public.order_items (order_id, line_type, parent_item_id, product_id, variant_id, product_name, product_slug, variant_label, sku,
      size_ml, image_url, qty, unit_price, line_total, hsn_code, gst_rate, position)
    select nid, 'pack_item', new_item, c.product_id, c.variant_id, c.product_name, c.product_slug, c.variant_label, c.sku, c.size_ml, c.image_url,
      c.qty * (it ->> 'qty')::int, 0, 0, c.hsn_code, c.gst_rate, pos + row_number() over (order by c.position)::int
    from public.order_items c where c.parent_item_id = (it ->> 'order_item_id')::uuid and c.line_type = 'pack_item';
    pos := pos + 1 + coalesce((select count(*) from public.order_items c where c.parent_item_id = (it ->> 'order_item_id')::uuid and c.line_type = 'pack_item'), 0)::int;
  end loop;
  insert into public.order_events (order_id, kind, to_status, message, actor_role)
  values (nid, 'created', 'PENDING', 'Replacement for ' || o.order_number, 'admin');
  perform set_config('app.order_write', 'off', true);
  perform app_private.reserve_order(nid);
  perform public.set_order_status(nid, 'PACKED', 'Replacement ready to ship');
  update public.returns set status = 'REPLACED', resolution = 'REPLACE', replacement_order_id = nid, resolved_at = now() where id = p_return;
  return nid;
end $$;
