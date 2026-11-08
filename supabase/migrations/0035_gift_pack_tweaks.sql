-- 0035_gift_pack_tweaks: a pack sample of 0 ml means "no sample"; the admin preview gets each perfume's price at the
-- base size so it can show prices for rules that aren't saved yet.

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
  pack record;
  chosen_p uuid;
  gp_sample_ml numeric := app_private.setting_num('giftpack.sample_ml', 10);
begin
  select * into o from public.orders where id = p_order for update;
  if o.stock_reserved_at is not null then
    return;
  end if;

  for it in select variant_id, qty, product_name, variant_label from public.order_items where order_id = p_order and line_type in ('item', 'pack_item') loop
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
  select coalesce(array_agg(product_id), '{}') into bag_products from public.order_items where order_id = p_order and line_type in ('item', 'pack_item');
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

  -- Each gift pack comes with one sample of gp_sample_ml, chosen like Surprise me and never one of its own perfumes.
  for pack in
    select i.id, coalesce(array_agg(c.product_id) filter (where c.product_id is not null), '{}') as picks
    from public.order_items i
    join public.products gp on gp.id = i.product_id and gp.is_gift_pack
    left join public.order_items c on c.parent_item_id = i.id and c.line_type = 'pack_item'
    where i.order_id = p_order and i.line_type = 'item' and gp_sample_ml > 0
    group by i.id
  loop
    select p.id into chosen_p
    from public.products p
    where p.stock_unit = 'ml' and p.is_active and p.archived_at is null and not p.is_gift_pack and p.stock_ml >= gp_sample_ml
      and exists (select 1 from public.product_variants v where v.product_id = p.id and v.kind = 'sample' and v.in_sample_pool and v.is_active and not v.is_hidden)
      and not (p.id = any (pack.picks))
    order by -ln(1 - random()) / p.stock_ml
    limit 1;
    if chosen_p is null then
      short := short + 1;
      continue;
    end if;
    chosen := app_private.helper_variant(chosen_p, 'pack_sample', gp_sample_ml);
    begin
      perform app_private.apply_stock_change(chosen, -1, 'order', p_order, 'Gift pack sample');
    exception when others then
      if sqlerrm like 'STOCK_NEGATIVE%' then
        short := short + 1;
        continue;
      end if;
      raise;
    end;
    insert into public.order_items (order_id, line_type, parent_item_id, product_id, variant_id, product_name, product_slug, variant_label, sku,
      size_ml, image_url, qty, unit_price, line_total, hsn_code, gst_rate, sample_auto, position)
    select p_order, 'sample', pack.id, p.id, v.id, p.name, p.slug, trim_scale(gp_sample_ml) || ' ml sample (gift pack)', v.sku, v.size_ml,
      (select m.url from public.product_media m where m.product_id = p.id and m.kind = 'image' order by m.position limit 1),
      1, 0, 0, p.hsn_code, p.gst_rate, true, pos
    from public.product_variants v join public.products p on p.id = v.product_id where v.id = chosen;
    pos := pos + 1;
  end loop;

  perform set_config('app.order_write', 'on', true);
  update public.orders set samples_short = short, stock_reserved_at = now() where id = p_order;
  perform set_config('app.order_write', 'off', true);
end $$;

create or replace function public.gift_pack_options()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  size_ml numeric := app_private.setting_num('giftpack.size_ml', 20);
  base_ml numeric := app_private.setting_num('giftpack.price_base_ml', 30);
  pct numeric := least(1000, greatest(0, app_private.setting_num('giftpack.price_percent', 66.67)));
begin
  return jsonb_build_object(
    'enabled', app_private.setting_bool('giftpack.enabled', false) and exists (select 1 from public.products where is_gift_pack),
    'count', greatest(1, app_private.setting_num('giftpack.count', 5)::int),
    'size_ml', size_ml,
    'price_base_ml', base_ml,
    'price_percent', pct,
    'discount_percent', least(90, greatest(0, app_private.setting_num('giftpack.discount_percent', 0))),
    'sample_ml', app_private.setting_num('giftpack.sample_ml', 10),
    'perfumes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_id', p.id, 'name', p.name, 'slug', p.slug,
        'image', (select m.url from public.product_media m where m.product_id = p.id and m.kind = 'image' order by m.position limit 1),
        'price', round(coalesce(v.price, p.base_price) * pct / 100),
        'base_price', coalesce(v.price, p.base_price),
        'max_picks', case when size_ml > 0 then floor(p.stock_ml / size_ml)::int else 0 end
      ) order by p.name)
      from public.products p
      join lateral (
        select x.price from public.product_variants x
        where x.product_id = p.id and x.kind = 'retail' and x.is_active and not x.is_hidden and x.size_ml = base_ml
        order by x.position limit 1
      ) v on true
      where p.is_active and p.archived_at is null and p.stock_unit = 'ml' and not p.is_gift_pack
    ), '[]'::jsonb));
end $$;
