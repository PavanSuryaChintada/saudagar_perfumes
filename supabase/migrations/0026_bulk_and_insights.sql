-- 0026_bulk_and_insights: bulk actions for orders, sizes (price and stock) and products, and the data behind the
-- dashboard's Today / Orders / Payments / Stock views. Every function is admin-only; bulk actions handle each row
-- on its own, so one bad row is reported and skipped instead of undoing the rest.

-- "CODE: sentence" → "sentence"
create or replace function app_private.plain_error(p text)
returns text language sql immutable set search_path = '' as $$
  select coalesce(substring(p from '^[A-Z][A-Z0-9_]{2,}:\s*(.*)$'), p)
$$;

-- ============================================================ orders
create or replace function public.bulk_order_status(p_orders uuid[], p_status text, p_note text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare oid uuid; done int := 0; skipped jsonb := '[]'::jsonb; num text;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN: Only admins can change orders.'; end if;
  foreach oid in array coalesce(p_orders, '{}') loop
    begin
      perform public.set_order_status(oid, p_status, p_note);
      done := done + 1;
    exception when others then
      select order_number into num from public.orders where id = oid;
      skipped := skipped || jsonb_build_object('order_number', coalesce(num, '?'), 'message', app_private.plain_error(sqlerrm));
    end;
  end loop;
  return jsonb_build_object('done', done, 'skipped', skipped);
end $$;

-- rows: [{order_id, courier, tracking}]
create or replace function public.bulk_ship_orders(p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r jsonb; done int := 0; skipped jsonb := '[]'::jsonb; num text;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN: Only admins can ship orders.'; end if;
  for r in select e from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) e loop
    begin
      perform public.ship_order((r ->> 'order_id')::uuid, r ->> 'courier', r ->> 'tracking', null);
      done := done + 1;
    exception when others then
      select order_number into num from public.orders where id = nullif(r ->> 'order_id', '')::uuid;
      skipped := skipped || jsonb_build_object('order_number', coalesce(num, '?'), 'message', app_private.plain_error(sqlerrm));
    end;
  end loop;
  return jsonb_build_object('done', done, 'skipped', skipped);
end $$;

-- ============================================================ sizes: price, compare-at price and stock from a sheet
-- rows: [{sku, price?, compare_at_price?, stock?}]. A key that is absent is left alone; price null = use the
-- product's base price; stock is the new count (the difference is logged as a correction).
create or replace function public.bulk_update_variants(p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  r jsonb;
  v public.product_variants;
  sku text;
  target int;
  updated int := 0;
  stock_changes int := 0;
  errors jsonb := '[]'::jsonb;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN: Only admins can change prices and stock.'; end if;
  for r in select e from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) e loop
    sku := upper(trim(coalesce(r ->> 'sku', '')));
    begin
      select * into v from public.product_variants where upper(product_variants.sku) = sku for update;
      if not found then
        raise exception 'SKU_NOT_FOUND: No size has the SKU %.', sku;
      end if;
      if r ? 'price' and (r -> 'price') <> 'null'::jsonb and (r ->> 'price')::numeric < 0 then
        raise exception 'PRICE: Prices can''t be negative.';
      end if;
      if r ? 'price' or r ? 'compare_at_price' then
        update public.product_variants set
          price = case when r ? 'price' then nullif(r ->> 'price', '')::numeric else price end,
          compare_at_price = case when r ? 'compare_at_price' then nullif(r ->> 'compare_at_price', '')::numeric else compare_at_price end
        where id = v.id;
      end if;
      if r ? 'stock' and (r -> 'stock') <> 'null'::jsonb then
        target := (r ->> 'stock')::int;
        if target < 0 then raise exception 'STOCK: Stock can''t be below 0.'; end if;
        if target <> v.stock then
          perform app_private.apply_stock_change(v.id, target - v.stock, 'correction', null, 'Bulk update from spreadsheet');
          stock_changes := stock_changes + 1;
        end if;
      end if;
      updated := updated + 1;
    exception when others then
      errors := errors || jsonb_build_object('sku', sku, 'message', app_private.plain_error(sqlerrm));
    end;
  end loop;
  return jsonb_build_object('updated', updated, 'stock_changes', stock_changes, 'errors', errors);
end $$;

-- ============================================================ products
-- actions: activate, deactivate, archive, restore, add_category, remove_category, add_collection, remove_collection, set_badge
create or replace function public.bulk_product_action(p_ids uuid[], p_action text, p_value text default null)
returns int language plpgsql security definer set search_path = '' as $$
declare n int := 0; pid uuid;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN: Only admins can change products.'; end if;
  if coalesce(array_length(p_ids, 1), 0) = 0 then return 0; end if;
  case p_action
    when 'activate' then
      update public.products set is_active = true where id = any (p_ids) and archived_at is null;
      get diagnostics n = row_count;
    when 'deactivate' then
      update public.products set is_active = false where id = any (p_ids);
      get diagnostics n = row_count;
    when 'archive', 'restore' then
      foreach pid in array p_ids loop
        perform public.archive_product(pid, p_action = 'archive');
        n := n + 1;
      end loop;
    when 'add_category' then
      insert into public.product_categories (product_id, category_id)
      select p.id, p_value::uuid from public.products p where p.id = any (p_ids) and p.primary_category_id is distinct from p_value::uuid
      on conflict do nothing;
      get diagnostics n = row_count;
    when 'remove_category' then
      delete from public.product_categories where product_id = any (p_ids) and category_id = p_value::uuid;
      get diagnostics n = row_count;
    when 'add_collection' then
      insert into public.product_collections (product_id, collection_id, position)
      select p.id, p_value::uuid, coalesce((select max(position) + 1 from public.product_collections where collection_id = p_value::uuid), 0)
      from public.products p where p.id = any (p_ids)
      on conflict do nothing;
      get diagnostics n = row_count;
    when 'remove_collection' then
      delete from public.product_collections where product_id = any (p_ids) and collection_id = p_value::uuid;
      get diagnostics n = row_count;
    when 'set_badge' then
      update public.products set badge = nullif(trim(coalesce(p_value, '')), '') where id = any (p_ids);
      get diagnostics n = row_count;
    else
      raise exception 'BULK_ACTION: Unknown action.';
  end case;
  return n;
end $$;

-- ============================================================ dashboard views
-- Orders that count as sales since a moment: not cancelled, not replacements, and paid if online.
create or replace function app_private.sales_since(p_from timestamptz)
returns setof public.orders language sql stable security definer set search_path = '' as $$
  select * from public.orders
  where created_at >= p_from and status <> 'CANCELLED' and replacement_for is null
    and (payment_method = 'COD' or payment_status not in ('PENDING', 'FAILED'))
$$;

create or replace function public.admin_insights(p_days int default 30)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  days int := least(366, greatest(1, coalesce(p_days, 30)));
  today timestamptz := date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';
  since timestamptz := today - make_interval(days => days - 1);
  low int := app_private.setting_num('inventory.low_stock_threshold', 5)::int;
  revenue numeric;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN: Only admins can see this.'; end if;

  select coalesce(sum(total), 0) into revenue from app_private.sales_since(since);

  return jsonb_build_object(
    'days', days,
    'today', jsonb_build_object(
      'orders', (select count(*) from app_private.sales_since(today)),
      'revenue', (select coalesce(sum(total), 0) from app_private.sales_since(today)),
      'week_orders', (select count(*) from app_private.sales_since(today - interval '6 days')),
      'week_revenue', (select coalesce(sum(total), 0) from app_private.sales_since(today - interval '6 days')),
      'to_pack', (select count(*) from public.orders where status = 'PENDING' and (payment_method = 'COD' or payment_status = 'PAID')),
      'to_ship', (select count(*) from public.orders where status = 'PACKED'),
      'unpaid', (select count(*) from public.orders where status = 'PENDING' and payment_method = 'ONLINE' and payment_status in ('PENDING', 'FAILED')),
      'returns_waiting', (select count(*) from public.returns where status in ('REQUESTED', 'RECEIVED')),
      'refunds_due', (select count(*) from public.refunds_due())
    ),
    'pipeline', jsonb_build_object(
      'steps', jsonb_build_array(
        jsonb_build_object('status', 'PENDING', 'label', 'To pack', 'count', (select count(*) from public.orders where status = 'PENDING' and (payment_method = 'COD' or payment_status = 'PAID'))),
        jsonb_build_object('status', 'PACKED', 'label', 'Packed', 'count', (select count(*) from public.orders where status = 'PACKED')),
        jsonb_build_object('status', 'SHIPPED', 'label', 'Shipped', 'count', (select count(*) from public.orders where status = 'SHIPPED')),
        jsonb_build_object('status', 'OUT_FOR_DELIVERY', 'label', 'Out for delivery', 'count', (select count(*) from public.orders where status = 'OUT_FOR_DELIVERY')),
        jsonb_build_object('status', 'DELIVERED', 'label', 'Delivered', 'count', (select count(*) from public.orders where status = 'DELIVERED' and delivered_at >= since))
      ),
      'cancelled', (select count(*) from public.orders where status = 'CANCELLED' and cancelled_at >= since),
      'rto', (select count(*) from public.orders where status = 'RTO' and rto_at >= since),
      'late', (
        select coalesce(jsonb_agg(x order by (x ->> 'age')::int desc), '[]'::jsonb) from (
          select jsonb_build_object('id', id, 'order_number', order_number, 'customer', customer_name, 'stage', 'Not packed',
                   'age', floor(extract(epoch from now() - created_at) / 86400)::int) as x
          from public.orders where status = 'PENDING' and (payment_method = 'COD' or payment_status = 'PAID') and created_at < now() - interval '2 days'
          union all
          select jsonb_build_object('id', id, 'order_number', order_number, 'customer', customer_name, 'stage', 'Packed, not shipped',
                   'age', floor(extract(epoch from now() - coalesce(packed_at, created_at)) / 86400)::int)
          from public.orders where status = 'PACKED' and coalesce(packed_at, created_at) < now() - interval '2 days'
          union all
          select jsonb_build_object('id', id, 'order_number', order_number, 'customer', customer_name, 'stage', 'Not delivered yet',
                   'age', floor(extract(epoch from now() - coalesce(shipped_at, created_at)) / 86400)::int)
          from public.orders where status in ('SHIPPED', 'OUT_FOR_DELIVERY') and coalesce(shipped_at, created_at) < now() - interval '10 days'
          limit 25
        ) l
      )
    ),
    'payments', jsonb_build_object(
      'revenue', revenue,
      'cod', (select jsonb_build_object('orders', count(*), 'revenue', coalesce(sum(total), 0)) from app_private.sales_since(since) where payment_method = 'COD'),
      'online', (select jsonb_build_object('orders', count(*), 'revenue', coalesce(sum(total), 0)) from app_private.sales_since(since) where payment_method = 'ONLINE'),
      'cod_to_collect', (select jsonb_build_object('orders', count(*), 'amount', coalesce(sum(total), 0)) from public.orders
                         where payment_method = 'COD' and payment_status <> 'PAID' and status in ('PENDING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY')),
      'refunds', (select jsonb_build_object('count', count(*), 'amount', coalesce(sum(amount), 0)) from public.refunds where created_at >= since and status <> 'FAILED'),
      'rto_cod', (select count(*) from public.orders where status = 'RTO' and payment_method = 'COD' and rto_at >= since),
      'cod_shipped', (select count(*) from public.orders where payment_method = 'COD' and shipped_at >= since)
    ),
    'stock', jsonb_build_object(
      'low_threshold', low,
      'sold_out', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select jsonb_build_object('id', p.id, 'product', p.name, 'size', v.label, 'sku', v.sku, 'stock', v.stock) as x
        from public.product_variants v join public.products p on p.id = v.product_id
        where v.kind = 'retail' and v.is_active and not v.is_hidden and p.is_active and p.archived_at is null and v.stock <= 0
        order by p.name limit 20) s),
      'low', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select jsonb_build_object('id', p.id, 'product', p.name, 'size', v.label, 'sku', v.sku, 'stock', v.stock) as x
        from public.product_variants v join public.products p on p.id = v.product_id
        where v.kind = 'retail' and v.is_active and not v.is_hidden and p.is_active and p.archived_at is null and v.stock > 0 and v.stock <= low
        order by v.stock, p.name limit 20) s),
      'best', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select jsonb_build_object('id', i.product_id, 'product', max(i.product_name), 'units', sum(i.qty), 'revenue', sum(i.line_total)) as x
        from public.order_items i join app_private.sales_since(since) o on o.id = i.order_id
        where i.line_type = 'item' group by i.product_id order by sum(i.qty) desc limit 5) s),
      'slow', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select jsonb_build_object('id', p.id, 'product', p.name, 'stock', p.total_stock) as x
        from public.products p
        where p.is_active and p.archived_at is null and p.created_at < since
          and not exists (select 1 from public.order_items i join app_private.sales_since(since) o on o.id = i.order_id
                          where i.product_id = p.id and i.line_type = 'item')
        order by p.total_stock desc nulls last limit 8) s),
      'never_sold_sizes', (select count(*) from public.product_variants v join public.products p on p.id = v.product_id
                           where v.kind = 'retail' and v.is_active and p.is_active and p.archived_at is null and v.units_sold = 0),
      'vials', (select jsonb_build_object('in_stock', coalesce(sum(stock), 0), 'kinds', count(*), 'low', count(*) filter (where stock <= low))
                from public.product_variants v join public.products p on p.id = v.product_id
                where v.kind = 'sample' and v.in_sample_pool and v.is_active and p.archived_at is null)
    )
  );
end $$;

do $$
declare f text;
begin
  foreach f in array array['public.bulk_order_status(uuid[], text, text)', 'public.bulk_ship_orders(jsonb)', 'public.bulk_update_variants(jsonb)',
                            'public.bulk_product_action(uuid[], text, text)', 'public.admin_insights(int)'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;
