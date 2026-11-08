-- 0028_liquid_stock: a perfume's stock is the liquid the store has (in ml), not a count per bottle size.
--   * Each product is kept in 'ml' (perfumes) or 'piece' (gift sets, accessories: a count per size, as before).
--   * For ml products, every size's stock is worked out from the liquid: floor(ml left / size). A 50 ml bottle takes
--     50 ml, a free 5 ml sample takes 5 ml; a size shows sold out once less is left than the size.
--   * Every change is logged per product with the ml taken or added, so the history shows orders vs samples.
--   * Lock order: the product row first, then its sizes, so two orders for one perfume never deadlock.

insert into public.settings (key, value, is_public, description) values
  ('inventory.low_stock_ml', '100', false, 'Warn when a perfume has this many ml or fewer left')
on conflict (key) do nothing;

alter table public.products add column if not exists stock_unit text not null default 'ml';
alter table public.products drop constraint if exists products_stock_unit_check;
alter table public.products add constraint products_stock_unit_check check (stock_unit in ('ml', 'piece'));
alter table public.products add column if not exists stock_ml numeric(12, 2) not null default 0;
alter table public.products drop constraint if exists products_stock_ml_check;
alter table public.products add constraint products_stock_ml_check check (stock_ml >= 0);

alter table public.inventory_movements alter column variant_id drop not null;
alter table public.inventory_movements add column if not exists product_id uuid references public.products (id) on delete cascade;
alter table public.inventory_movements add column if not exists ml_delta numeric(12, 2);
alter table public.inventory_movements add column if not exists ml_after numeric(12, 2);
update public.inventory_movements m set product_id = v.product_id from public.product_variants v where v.id = m.variant_id and m.product_id is null;
create index if not exists inventory_movements_product_idx on public.inventory_movements (product_id, created_at desc);

-- Liquid and the stock mode change only through the functions below, so every change is logged.
create or replace function app_private.products_guard_liquid()
returns trigger language plpgsql set search_path = '' as $$
begin
  if coalesce(current_setting('app.stock_write', true), '') <> 'on'
     and (new.stock_ml is distinct from old.stock_ml or new.stock_unit is distinct from old.stock_unit) then
    raise exception 'STOCK_DIRECT_WRITE: Change stock from Inventory, so every change is logged.';
  end if;
  return new;
end $$;
drop trigger if exists products_guard_liquid on public.products;
create trigger products_guard_liquid before update on public.products for each row execute function app_private.products_guard_liquid();

-- Every size of an ml product: how many fit in what's left.
create or replace function app_private.sync_liquid_sizes(p_product uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('app.stock_write', 'on', true);
  update public.product_variants v
  set stock = case when coalesce(v.size_ml, 0) > 0 then floor(p.stock_ml / v.size_ml)::int else 0 end
  from public.products p
  where p.id = v.product_id and p.id = p_product and p.stock_unit = 'ml'
    and v.stock is distinct from (case when coalesce(v.size_ml, 0) > 0 then floor(p.stock_ml / v.size_ml)::int else 0 end);
  perform set_config('app.stock_write', 'off', true);
  perform app_private.refresh_product_derived(p_product);
end $$;

-- The one place liquid changes. Locks the product row first.
create or replace function app_private.apply_liquid_change(p_product uuid, p_ml numeric, p_reason text, p_order uuid, p_note text, p_variant uuid, p_units int)
returns numeric language plpgsql security definer set search_path = '' as $$
declare cur numeric; nxt numeric; pname text;
begin
  select stock_ml, name into cur, pname from public.products where id = p_product for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND: That product no longer exists.'; end if;
  nxt := round(cur + coalesce(p_ml, 0), 2);
  if nxt < 0 then
    raise exception 'STOCK_NEGATIVE: % has only % ml left.', pname, trim(to_char(cur, 'FM999999990.##'));
  end if;
  perform set_config('app.stock_write', 'on', true);
  update public.products set stock_ml = nxt where id = p_product;
  perform set_config('app.stock_write', 'off', true);
  perform app_private.sync_liquid_sizes(p_product);
  insert into public.inventory_movements (variant_id, product_id, delta, stock_after, reason, order_id, note, ml_delta, ml_after)
  values (p_variant, p_product, coalesce(p_units, 0), coalesce((select stock from public.product_variants where id = p_variant), 0),
          p_reason, p_order, nullif(trim(coalesce(p_note, '')), ''), round(coalesce(p_ml, 0), 2), nxt);
  return nxt;
end $$;

-- Orders, cancellations, returns and admin adjustments all come through here. ml products move liquid; piece
-- products move the size's own count (as before).
create or replace function app_private.apply_stock_change(
  p_variant uuid, p_delta int, p_reason text, p_order uuid default null, p_note text default null)
returns int language plpgsql security definer set search_path = '' as $$
declare cur int; nxt int; vlabel text; vsize numeric; pid uuid; unit text;
begin
  if p_reason not in ('order', 'cancel_restock', 'return_restock', 'restock', 'damaged', 'tester_sample_use',
                      'write_off', 'correction', 'initial') then
    raise exception 'STOCK_REASON: "%" is not a stock change reason.', p_reason;
  end if;
  select v.size_ml, v.product_id, p.stock_unit, p.name || ' · ' || v.label into vsize, pid, unit, vlabel
    from public.product_variants v join public.products p on p.id = v.product_id where v.id = p_variant;
  if not found then
    raise exception 'VARIANT_NOT_FOUND: That size no longer exists.';
  end if;
  if p_delta = 0 then
    select stock into cur from public.product_variants where id = p_variant;
    return cur;
  end if;
  if unit = 'ml' then
    if coalesce(vsize, 0) <= 0 then
      raise exception 'SIZE_ML_REQUIRED: % needs its size in ml, because this perfume''s stock is kept in ml.', vlabel;
    end if;
    perform app_private.apply_liquid_change(pid, p_delta * vsize, p_reason, p_order, p_note, p_variant, p_delta);
    select stock into nxt from public.product_variants where id = p_variant;
    return nxt;
  end if;
  select v.stock into cur from public.product_variants v where v.id = p_variant for update;
  nxt := cur + p_delta;
  if nxt < 0 then
    raise exception 'STOCK_NEGATIVE: % has only % in stock.', vlabel, cur;
  end if;
  perform set_config('app.stock_write', 'on', true);
  update public.product_variants set stock = nxt where id = p_variant;
  perform set_config('app.stock_write', 'off', true);
  insert into public.inventory_movements (variant_id, product_id, delta, stock_after, reason, order_id, note)
    values (p_variant, pid, p_delta, nxt, p_reason, p_order, nullif(trim(coalesce(p_note, '')), ''));
  return nxt;
end $$;

-- New or resized sizes of an ml product get their count straight away.
create or replace function app_private.variants_sync_liquid()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.products where id = new.product_id and stock_unit = 'ml') then
    perform app_private.sync_liquid_sizes(new.product_id);
  end if;
  return null;
end $$;
drop trigger if exists variants_sync_liquid on public.product_variants;
create trigger variants_sync_liquid after insert or update of size_ml on public.product_variants
  for each row execute function app_private.variants_sync_liquid();

-- ============================================================ admin: liquid in, out, or set; stock mode; history
-- p_mode: add | remove | set. p_unit: ml | L | tola (1 tola = 11.66 ml).
create or replace function public.adjust_liquid(p_product uuid, p_mode text, p_amount numeric, p_unit text, p_reason text default null, p_note text default null)
returns numeric language plpgsql security definer set search_path = '' as $$
declare
  factor numeric := case lower(coalesce(p_unit, 'ml')) when 'ml' then 1 when 'l' then 1000 when 'tola' then 11.66 end;
  ml numeric;
  cur numeric;
  unit text;
  reason text;
begin
  if not public.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'NOT_ADMIN: Only admins can change stock.';
  end if;
  if factor is null then raise exception 'STOCK_UNIT: Choose ml, L or tola.'; end if;
  if p_mode not in ('add', 'remove', 'set') then raise exception 'STOCK_MODE: Choose add, remove or set.'; end if;
  if p_amount is null or p_amount < 0 then raise exception 'STOCK_AMOUNT: Enter an amount of 0 or more.'; end if;
  select stock_ml, stock_unit into cur, unit from public.products where id = p_product;
  if not found then raise exception 'PRODUCT_NOT_FOUND: That product no longer exists.'; end if;
  if unit <> 'ml' then raise exception 'STOCK_UNIT: This product is counted in pieces. Adjust each size instead.'; end if;
  ml := round(p_amount * factor, 2);
  ml := case p_mode when 'add' then ml when 'remove' then -ml else ml - cur end;
  if ml = 0 then return cur; end if;
  reason := coalesce(nullif(p_reason, ''), case when p_mode = 'add' then 'restock' else 'correction' end);
  return app_private.apply_liquid_change(p_product, ml, reason, null,
    concat_ws(' · ', nullif(trim(coalesce(p_note, '')), ''), case when lower(p_unit) <> 'ml' then trim(to_char(p_amount, 'FM999999990.##')) || ' ' || p_unit end),
    null, 0);
end $$;

-- Switch a product between ml (liquid) and pieces. To ml: the liquid is what the current bottles hold.
create or replace function public.set_stock_mode(p_product uuid, p_unit text)
returns void language plpgsql security definer set search_path = '' as $$
declare cur text; total numeric;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN: Only admins can change stock.'; end if;
  if p_unit not in ('ml', 'piece') then raise exception 'STOCK_UNIT: Choose ml or pieces.'; end if;
  select stock_unit into cur from public.products where id = p_product for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND: That product no longer exists.'; end if;
  if cur = p_unit then return; end if;
  if p_unit = 'ml' then
    select coalesce(sum(coalesce(size_ml, 0) * stock), 0) into total from public.product_variants where product_id = p_product;
    perform set_config('app.stock_write', 'on', true);
    update public.products set stock_unit = 'ml', stock_ml = 0 where id = p_product;
    perform set_config('app.stock_write', 'off', true);
    perform app_private.apply_liquid_change(p_product, total, 'correction', null, 'Switched to ml: the bottles in stock added up', null, 0);
  else
    perform set_config('app.stock_write', 'on', true);
    update public.products set stock_unit = 'piece', stock_ml = 0 where id = p_product;
    perform set_config('app.stock_write', 'off', true);
    insert into public.inventory_movements (product_id, delta, stock_after, reason, note)
    values (p_product, 0, 0, 'correction', 'Switched to counting pieces; each size keeps its current count');
  end if;
end $$;

-- What a product's stock went into: totals by kind, and the latest changes.
create or replace function public.product_stock_history(p_product uuid, p_limit int default 100)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN: Only admins can see this.'; end if;
  return jsonb_build_object(
    'totals', (
      select jsonb_build_object(
        'orders_ml', coalesce(-sum(m.ml_delta) filter (where m.reason = 'order' and coalesce(v.kind, 'retail') = 'retail'), 0),
        'samples_ml', coalesce(-sum(m.ml_delta) filter (where m.reason = 'order' and v.kind = 'sample'), 0),
        'returned_ml', coalesce(sum(m.ml_delta) filter (where m.reason in ('cancel_restock', 'return_restock')), 0),
        'added_ml', coalesce(sum(m.ml_delta) filter (where m.reason in ('restock', 'initial') or (m.reason = 'correction' and m.ml_delta > 0)), 0),
        'removed_ml', coalesce(-sum(m.ml_delta) filter (where m.reason in ('damaged', 'write_off', 'tester_sample_use') or (m.reason = 'correction' and m.ml_delta < 0)), 0),
        'orders_units', coalesce(-sum(m.delta) filter (where m.reason = 'order' and coalesce(v.kind, 'retail') = 'retail'), 0),
        'samples_units', coalesce(-sum(m.delta) filter (where m.reason = 'order' and v.kind = 'sample'), 0))
      from public.inventory_movements m left join public.product_variants v on v.id = m.variant_id
      where m.product_id = p_product),
    'rows', (
      select coalesce(jsonb_agg(x order by (x ->> 'created_at') desc), '[]'::jsonb) from (
        select jsonb_build_object('id', m.id, 'created_at', m.created_at, 'reason', m.reason, 'note', m.note, 'delta', m.delta,
          'ml_delta', m.ml_delta, 'ml_after', m.ml_after, 'stock_after', m.stock_after, 'size', v.label, 'kind', v.kind,
          'order_id', m.order_id, 'order_number', o.order_number) as x
        from public.inventory_movements m
        left join public.product_variants v on v.id = m.variant_id
        left join public.orders o on o.id = m.order_id
        where m.product_id = p_product
        order by m.created_at desc
        limit least(500, greatest(1, coalesce(p_limit, 100)))) r)
  );
end $$;

-- Low-stock alerts: ml products warn on the liquid, piece products on each size (as before).
create or replace function app_private.notify_low_stock()
returns trigger language plpgsql security definer set search_path = '' as $$
declare low int := app_private.setting_num('inventory.low_stock_threshold', 5)::int; name text; unit text;
begin
  select p.name, p.stock_unit into name, unit from public.products p where p.id = new.product_id;
  if unit = 'piece' and new.stock <= low and old.stock > low and new.is_active and not new.is_hidden then
    perform app_private.notify_admin('low_stock', case when new.stock = 0 then 'Sold out · ' else 'Low stock · ' end || name || ' ' || new.label,
      new.stock || ' left', '/admin/inventory');
  end if;
  if old.stock = 0 and new.stock > 0 and exists (select 1 from public.back_in_stock_requests where variant_id = new.id and notified_at is null) then
    perform app_private.notify_admin('back_in_stock', 'Back in stock · ' || name || ' ' || new.label,
      (select count(*) from public.back_in_stock_requests where variant_id = new.id and notified_at is null) || ' customer(s) waiting', '/admin/back-in-stock');
  end if;
  return new;
end $$;

create or replace function app_private.notify_low_liquid()
returns trigger language plpgsql security definer set search_path = '' as $$
declare low numeric := app_private.setting_num('inventory.low_stock_ml', 100);
begin
  if new.stock_unit = 'ml' and new.is_active and new.archived_at is null and new.stock_ml <= low and old.stock_ml > low then
    perform app_private.notify_admin('low_stock', case when new.stock_ml = 0 then 'Sold out · ' else 'Low stock · ' end || new.name,
      trim(to_char(new.stock_ml, 'FM999999990.##')) || ' ml left', '/admin/inventory');
  end if;
  return new;
end $$;
drop trigger if exists notify_low_liquid on public.products;
create trigger notify_low_liquid after update of stock_ml on public.products for each row execute function app_private.notify_low_liquid();

-- Free samples come from the perfume's own liquid; no row locks here (the liquid is checked under the product lock).
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
$$;

-- ============================================================ today's stock → liquid
-- Products whose sizes all have a size in ml become ml products: the liquid is what their bottles and vials hold.
-- The rest (sets, accessories) keep counting pieces.
do $$
declare rec record; total numeric;
begin
  perform set_config('app.stock_write', 'on', true);
  update public.products p set stock_unit = 'piece'
  where exists (select 1 from public.product_variants v where v.product_id = p.id and v.kind = 'retail' and v.size_ml is null)
     or not exists (select 1 from public.product_variants v where v.product_id = p.id);
  perform set_config('app.stock_write', 'off', true);
  for rec in select id from public.products where stock_unit = 'ml' and stock_ml = 0 loop
    select coalesce(sum(size_ml * stock), 0) into total from public.product_variants where product_id = rec.id;
    if total > 0 then
      perform app_private.apply_liquid_change(rec.id, total, 'correction', null, 'Stock moved to ml: bottles and sample vials added up', null, 0);
    else
      perform app_private.sync_liquid_sizes(rec.id);
    end if;
  end loop;
end $$;

-- ============================================================ functions that now know about liquid
create or replace function app_private.reserve_order(p_order uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  it record;
  slots int;
  pick text;
  chosen uuid;
  short int := 0;
  used uuid[] := '{}';
  bag_products uuid[];
  allow_dup boolean := app_private.setting_bool('samples.allow_duplicates', true);
  pos int;
begin
  select * into o from public.orders where id = p_order for update;
  if o.stock_reserved_at is not null then
    return;
  end if;

  for it in select variant_id, qty, product_name, variant_label from public.order_items where order_id = p_order and line_type = 'item' loop
    begin
      perform app_private.apply_stock_change(it.variant_id, -it.qty, 'order', p_order, null);
    exception when others then
      if sqlerrm like 'STOCK_NEGATIVE%' then
        raise exception 'OUT_OF_STOCK: % · % sold out before your order went through.', it.product_name, it.variant_label;
      end if;
      raise;
    end;
  end loop;

  perform set_config('app.derived_write', 'on', true);
  update public.product_variants v set units_sold = v.units_sold + x.qty
  from (select variant_id as id, sum(qty)::int as qty from public.order_items where order_id = p_order and line_type = 'item' group by 1) x
  where v.id = x.id;
  update public.products p set units_sold = p.units_sold + x.qty
  from (select product_id as id, sum(qty)::int as qty from public.order_items where order_id = p_order and line_type = 'item' group by 1) x
  where p.id = x.id;
  perform set_config('app.derived_write', 'off', true);

  -- Free samples: honour each pick if still in stock, otherwise pick by stock weight; never block the order.
  slots := coalesce(o.samples_entitled, 0);
  select coalesce(array_agg(product_id), '{}') into bag_products from public.order_items where order_id = p_order and line_type = 'item';
  select coalesce(max(position) + 1, 0) into pos from public.order_items where order_id = p_order;
  for i in 1..slots loop
    chosen := null;
    pick := o.sample_picks ->> (i - 1);
    if pick is not null and pick ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select v.id into chosen
      from public.product_variants v join public.products p on p.id = v.product_id
      where v.id = pick::uuid and v.kind = 'sample' and v.in_sample_pool and v.is_active and not v.is_hidden and v.stock > 0
        and p.is_active and p.archived_at is null and (allow_dup or not (v.id = any (used)));
    else
      pick := null;
    end if;
    if chosen is null then
      chosen := app_private.pick_sample(used, bag_products, allow_dup);
    end if;
    if chosen is null then
      short := short + 1;
      continue;
    end if;
    begin
      perform app_private.apply_stock_change(chosen, -1, 'order', p_order, 'Free sample');
    exception when others then
      if sqlerrm like 'STOCK_NEGATIVE%' then
        short := short + 1;
        continue;
      end if;
      raise;
    end;
    used := used || chosen;
    insert into public.order_items (order_id, line_type, product_id, variant_id, product_name, product_slug, variant_label, sku,
      size_ml, image_url, qty, unit_price, line_total, hsn_code, gst_rate, sample_auto, position)
    select p_order, 'sample', p.id, v.id, p.name, p.slug, v.label, v.sku, v.size_ml,
      (select m.url from public.product_media m where m.product_id = p.id and m.kind = 'image' order by m.position limit 1),
      1, 0, 0, p.hsn_code, p.gst_rate, (pick is null or pick::uuid <> v.id), pos
    from public.product_variants v join public.products p on p.id = v.product_id where v.id = chosen;
    pos := pos + 1;
  end loop;

  perform set_config('app.order_write', 'on', true);
  update public.orders set samples_short = short, stock_reserved_at = now() where id = p_order;
  perform set_config('app.order_write', 'off', true);
end $$;

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
  cod_max numeric := app_private.setting_num('cod.max_order', 0);
  online_on boolean := app_private.setting_bool('payments.online_enabled', false);
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

  -- Several sizes of one perfume draw from the same liquid: the bag can't need more ml than is left.
  for r in
    select p.name, p.stock_ml, sum((l ->> 'size_ml')::numeric * (l ->> 'qty')::int) as need
    from jsonb_array_elements(lines) l join public.products p on p.id = (l ->> 'product_id')::uuid
    where p.stock_unit = 'ml' and nullif(l ->> 'size_ml', '') is not null
    group by p.id, p.name, p.stock_ml
    having sum((l ->> 'size_ml')::numeric * (l ->> 'qty')::int) > p.stock_ml
  loop
    problems := problems || jsonb_build_object('reason', 'LOW_STOCK', 'name', r.name,
      'message', 'Only ' || trim(to_char(r.stock_ml, 'FM999999990.##')) || ' ml of ' || r.name || ' is left, and your bag needs '
                 || trim(to_char(r.need, 'FM999999990.##')) || ' ml. Reduce the sizes or quantities.');
  end loop;

  coupon := app_private.coupon_quote(p_user, p_coupon, subtotal, lines);
  if coalesce((coupon ->> 'ok')::boolean, false) then
    discount := least(subtotal, coalesce((coupon ->> 'discount')::numeric, 0));
  end if;
  after_discount := greatest(0, subtotal - discount);
  -- Settings: "free delivery from X"; 0 means every order ships free.
  shipping := case when jsonb_array_length(lines) = 0 then 0
                   when after_discount >= threshold then 0
                   else fee end;
  total := after_discount + shipping;

  cod_reason := case when not cod_enabled then 'COD_OFF'
                     when cod_min > 0 and total < cod_min then 'COD_MIN'
                     when cod_max > 0 and total > cod_max then 'COD_MAX' end;

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
      'max_order', case when cod_max > 0 then cod_max end,
      'message', case cod_reason
        when 'COD_OFF' then 'Cash on delivery is not available right now.'
        when 'COD_MIN' then 'Cash on delivery is available on orders of ' || app_private.rupees(cod_min) || ' or more.'
        when 'COD_MAX' then 'Cash on delivery is available on orders up to ' || app_private.rupees(cod_max) || '. '
          || case when online_on then 'Please pay online for this order.' else 'Split the order, or contact us and we''ll help.' end
      end),
    'online', jsonb_build_object('allowed', online_on),
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

create or replace function public.bulk_update_variants(p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  r jsonb;
  v public.product_variants;
  unit text;
  liquid_changes int := 0;
  v_sku text;
  target int;
  updated int := 0;
  stock_changes int := 0;
  errors jsonb := '[]'::jsonb;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN: Only admins can change prices and stock.'; end if;
  for r in select e from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) e loop
    v_sku := upper(trim(coalesce(r ->> 'sku', '')));
    begin
      select * into v from public.product_variants where upper(product_variants.sku) = v_sku for update;
      if not found then
        raise exception 'SKU_NOT_FOUND: No size has the SKU %.', v_sku;
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
      select stock_unit into unit from public.products where id = v.product_id;
      if r ? 'liquid_ml' and (r -> 'liquid_ml') <> 'null'::jsonb then
        if unit <> 'ml' then raise exception 'STOCK_UNIT: This product is counted in pieces; use the Stock column.'; end if;
        if (r ->> 'liquid_ml')::numeric < 0 then raise exception 'STOCK: Liquid left can''t be below 0.'; end if;
        perform public.adjust_liquid(v.product_id, 'set', (r ->> 'liquid_ml')::numeric, 'ml', 'correction', 'Bulk update from spreadsheet');
        liquid_changes := liquid_changes + 1;
      end if;
      if r ? 'stock' and (r -> 'stock') <> 'null'::jsonb and unit = 'ml' then
        raise exception 'STOCK_UNIT: This perfume''s stock is kept in ml; change the Liquid left column instead.';
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
      errors := errors || jsonb_build_object('sku', v_sku, 'message', app_private.plain_error(sqlerrm));
    end;
  end loop;
  return jsonb_build_object('updated', updated, 'stock_changes', stock_changes + liquid_changes, 'errors', errors);
end $$;

create or replace function public.admin_insights(p_days int default 30)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  days int := least(366, greatest(1, coalesce(p_days, 30)));
  today timestamptz := date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';
  since timestamptz := today - make_interval(days => days - 1);
  low int := app_private.setting_num('inventory.low_stock_threshold', 5)::int;
  low_ml numeric := app_private.setting_num('inventory.low_stock_ml', 100);
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
        select x from (
          select jsonb_build_object('id', p.id, 'product', p.name, 'size', 'liquid', 'sku', null, 'stock', null, 'ml', p.stock_ml) as x, p.stock_ml as k, p.name as n
          from public.products p
          where p.stock_unit = 'ml' and p.is_active and p.archived_at is null and p.stock_ml > 0 and p.stock_ml <= low_ml
          union all
          select jsonb_build_object('id', p.id, 'product', p.name, 'size', v.label, 'sku', v.sku, 'stock', v.stock, 'ml', null), v.stock, p.name
          from public.product_variants v join public.products p on p.id = v.product_id
          where p.stock_unit = 'piece' and v.kind = 'retail' and v.is_active and not v.is_hidden and p.is_active and p.archived_at is null and v.stock > 0 and v.stock <= low
        ) u order by k, n limit 20) s),
      'low_ml', low_ml,
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
      'vials', (select jsonb_build_object('in_stock', coalesce(sum(v.stock), 0), 'kinds', count(*), 'low', count(*) filter (where v.stock <= low))
                from public.product_variants v join public.products p on p.id = v.product_id
                where v.kind = 'sample' and v.in_sample_pool and v.is_active and p.archived_at is null)
    )
  );
end $$;

do $$
declare f text;
begin
  foreach f in array array['public.adjust_liquid(uuid, text, numeric, text, text, text)', 'public.set_stock_mode(uuid, text)', 'public.product_stock_history(uuid, int)'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;

notify pgrst, 'reload schema';
