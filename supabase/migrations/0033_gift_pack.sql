-- 0033_gift_pack: the Premium Gift Pack and suggested free samples.
--
-- A gift pack is the customer's own choice of perfumes (giftpack.count of them, repeats allowed), each poured as
-- giftpack.size_ml ml. Each costs giftpack.price_percent of that perfume's giftpack.price_base_ml price; the pack is
-- their sum less giftpack.discount_percent. Every pack also carries one free giftpack.sample_ml sample, chosen like
-- "Surprise me" and never one of its own perfumes. Every rule is a setting; words and pictures are the `gift_pack`
-- site block. Both are edited in Admin → Gift pack.
--
-- How it is stored, using the paths that already exist:
--  * the pack is one product (is_gift_pack) with one size whose stock isn't counted (track_stock = false: boxes
--    aren't counted, only the perfume poured into them);
--  * each perfume in a pack is an order line of type 'pack_item' under the pack line (parent_item_id), pointing at a
--    hidden helper size of that perfume (purpose 'gift_pack_fill', size giftpack.size_ml), so taking, returning and
--    reporting its liquid goes through apply_stock_change like everything else;
--  * the pack's sample is a 'sample' line under the pack line, on a hidden helper sample size (purpose 'pack_sample').

-- ============================================================ columns
alter table public.product_variants add column if not exists track_stock boolean not null default true;
alter table public.product_variants add column if not exists purpose text;
alter table public.product_variants drop constraint if exists product_variants_purpose_check;
alter table public.product_variants add constraint product_variants_purpose_check
  check (purpose is null or purpose in ('gift_pack_fill', 'pack_sample'));
create unique index if not exists product_variants_one_helper on public.product_variants (product_id, purpose, size_ml) where purpose is not null;

alter table public.products add column if not exists is_gift_pack boolean not null default false;
-- The pack is never listed in the shop as a product; it is sold only through the gift pack page.
alter table public.products drop constraint if exists products_gift_pack_hidden;
alter table public.products add constraint products_gift_pack_hidden check (not is_gift_pack or not is_active);

alter table public.order_items add column if not exists parent_item_id uuid references public.order_items (id) on delete cascade;
create index if not exists order_items_parent_idx on public.order_items (parent_item_id) where parent_item_id is not null;
alter table public.order_items drop constraint if exists order_items_line_type_check;
alter table public.order_items add constraint order_items_line_type_check check (line_type in ('item', 'sample', 'pack_item'));

-- ============================================================ rules (Admin → Gift pack)
insert into public.settings (key, value, is_public, description) values
  ('giftpack.enabled', 'true', true, 'Offer the Premium Gift Pack'),
  ('giftpack.count', '5', true, 'How many perfumes go in a gift pack'),
  ('giftpack.size_ml', '20', true, 'ml of each perfume in a gift pack'),
  ('giftpack.price_base_ml', '30', true, 'Pack perfumes are priced from this bottle size, and only perfumes sold in it can be picked'),
  ('giftpack.price_percent', '66.67', true, 'Each perfume in the pack costs this % of its price at that size'),
  ('giftpack.discount_percent', '0', true, 'Discount on the whole pack (%)'),
  ('giftpack.sample_ml', '10', true, 'Free sample in every pack (ml)')
on conflict (key) do nothing;

insert into public.site_blocks (key, value) values ('gift_pack', jsonb_build_object(
  'title', 'Premium Gift Pack',
  'tagline', 'Five perfumes of your choice, 20 ml each, in one gift box.',
  'intro', 'Pick any five perfumes. Choose the same one more than once if you like. A free 10 ml sample is added to every pack.',
  'image', '',
  'bag_heading', 'Try our Premium Gift Pack',
  'bag_text', 'Five perfumes of your choice, 20 ml each, in one gift box.',
  'bag_button', 'Build your pack',
  'add_button', 'Add the pack to bag',
  'sample_note', 'A free 10 ml sample comes with every pack.'))
on conflict (key) do nothing;

-- ============================================================ the pack product
do $$
declare pid uuid;
begin
  if not exists (select 1 from public.products where is_gift_pack) then
    perform set_config('app.stock_write', 'on', true);
    insert into public.products (slug, name, base_price, is_active, is_gift_pack, stock_unit, counts_toward_samples, hsn_code, gst_rate)
    values ('premium-gift-pack', 'Premium Gift Pack', 0, false, true, 'piece', false,
            coalesce(nullif(app_private.setting('product_defaults.hsn_code') #>> '{}', ''), '3303'),
            app_private.setting_num('product_defaults.gst_rate', 18))
    returning id into pid;
    insert into public.product_variants (product_id, kind, sku, label, price, stock, is_active, is_hidden, track_stock)
    values (pid, 'retail', 'GIFT-PACK', 'Gift pack', null, 0, true, false, false);
    perform set_config('app.stock_write', 'off', true);
  end if;
end $$;

-- ============================================================ helper sizes for pack perfumes and pack samples
create or replace function app_private.helper_variant(p_product uuid, p_purpose text, p_size numeric)
returns uuid language plpgsql security definer set search_path = '' as $$
declare vid uuid; base text; new_sku text; n int := 1;
begin
  select id into vid from public.product_variants where product_id = p_product and purpose = p_purpose and size_ml = p_size;
  if vid is not null then
    return vid;
  end if;
  perform 1 from public.products where id = p_product for update;
  select id into vid from public.product_variants where product_id = p_product and purpose = p_purpose and size_ml = p_size;
  if vid is not null then
    return vid;
  end if;
  select upper(regexp_replace(slug, '[^a-z0-9]+', '-', 'gi')) into base from public.products where id = p_product;
  base := base || case p_purpose when 'pack_sample' then '-GPS' else '-GP' end || trim_scale(p_size)::text;
  new_sku := base;
  while exists (select 1 from public.product_variants where sku = new_sku) loop
    n := n + 1;
    new_sku := base || '-' || n;
  end loop;
  insert into public.product_variants (product_id, kind, sku, size_ml, label, price, is_active, is_hidden, in_sample_pool, position, purpose)
  values (p_product, case when p_purpose = 'pack_sample' then 'sample' else 'retail' end, new_sku, p_size,
          trim_scale(p_size)::text || case when p_purpose = 'pack_sample' then ' ml sample (gift pack)' else ' ml (gift pack)' end,
          0, true, true, false, 9999, p_purpose)
  returning id into vid;
  return vid;
end $$;
revoke all on function app_private.helper_variant(uuid, text, numeric) from public;

create or replace function app_private.apply_stock_change(
  p_variant uuid, p_delta int, p_reason text, p_order uuid default null, p_note text default null)
returns int language plpgsql security definer set search_path = '' as $$
declare cur int; nxt int; vlabel text; vsize numeric; pid uuid; unit text; tracked boolean;
begin
  if p_reason not in ('order', 'cancel_restock', 'return_restock', 'restock', 'damaged', 'tester_sample_use',
                      'write_off', 'correction', 'initial') then
    raise exception 'STOCK_REASON: "%" is not a stock change reason.', p_reason;
  end if;
  select v.size_ml, v.product_id, p.stock_unit, p.name || ' · ' || v.label, v.track_stock into vsize, pid, unit, vlabel, tracked
    from public.product_variants v join public.products p on p.id = v.product_id where v.id = p_variant;
  if not found then
    raise exception 'VARIANT_NOT_FOUND: That size no longer exists.';
  end if;
  -- Sizes that aren't counted (the gift pack itself: only its perfumes are) never change stock.
  if not coalesce(tracked, true) then
    select stock into cur from public.product_variants where id = p_variant;
    return cur;
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
  -- Gift pack rules (Settings → Gift pack).
  gp_enabled boolean := app_private.setting_bool('giftpack.enabled', false);
  gp_count int := greatest(1, app_private.setting_num('giftpack.count', 5)::int);
  gp_size numeric := app_private.setting_num('giftpack.size_ml', 20);
  gp_base numeric := app_private.setting_num('giftpack.price_base_ml', 30);
  gp_pct numeric := least(1000, greatest(0, app_private.setting_num('giftpack.price_percent', 66.67)));
  gp_discount numeric := least(90, greatest(0, app_private.setting_num('giftpack.discount_percent', 0)));
  gp_sample_ml numeric := app_private.setting_num('giftpack.sample_ml', 10);
  gp_block jsonb := coalesce((select value from public.site_blocks where key = 'gift_pack'), '{}'::jsonb);
  gp_title text := coalesce(nullif(gp_block ->> 'title', ''), 'Premium Gift Pack');
  gp_product uuid;
  gp_variant uuid;
  pk jsonb;
  pick_txt text;
  gp record;
  pack_total numeric;
  pack_price numeric;
  pack_picks jsonb;
  pack_need jsonb := '[]'::jsonb;
  pack_bad text;
  unit_20 numeric;
begin
  for r in
    with req as (
      select (e ->> 'variant_id')::uuid as variant_id,
             least(99, sum(greatest(1, least(99, coalesce(nullif(e ->> 'qty', '')::int, 1)))))::int as qty
      from jsonb_array_elements(case when jsonb_typeof(p_items) = 'array' then p_items else '[]'::jsonb end) e
      where coalesce(e ->> 'variant_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and not (e ? 'picks')
      group by 1
    )
    select req.variant_id, req.qty, v.id as vid, v.kind, v.stock, v.size_ml, v.label, v.sku,
           (v.is_active and not v.is_hidden and p.is_active and p.archived_at is null and not p.is_gift_pack) as sellable,
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

  -- Gift packs: the customer's perfumes, each poured as gp_size ml and priced at gp_size/gp_base of its gp_base ml price.
  select p.id, v.id into gp_product, gp_variant
  from public.products p join public.product_variants v on v.product_id = p.id and v.kind = 'retail'
  where p.is_gift_pack order by p.created_at limit 1;
  for pk in
    select e from jsonb_array_elements(case when jsonb_typeof(p_items) = 'array' then p_items else '[]'::jsonb end) e where e ? 'picks'
  loop
    if not gp_enabled or gp_variant is null then
      problems := problems || jsonb_build_object('reason', 'UNAVAILABLE', 'name', gp_title, 'key', pk ->> 'key', 'variant_id', gp_variant,
        'message', gp_title || ' isn''t available right now. Remove it to continue.');
      continue;
    end if;
    if jsonb_typeof(pk -> 'picks') <> 'array' or jsonb_array_length(pk -> 'picks') <> gp_count then
      problems := problems || jsonb_build_object('reason', 'UNAVAILABLE', 'name', gp_title, 'key', pk ->> 'key', 'variant_id', gp_variant,
        'message', 'Choose ' || gp_count || ' perfumes for the ' || gp_title || '.');
      continue;
    end if;
    pack_total := 0;
    pack_picks := '[]'::jsonb;
    pack_bad := null;
    for pick_txt in select jsonb_array_elements_text(pk -> 'picks') loop
      if pick_txt !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        pack_bad := 'One of the perfumes in the ' || gp_title || ' is no longer available. Choose another.';
        exit;
      end if;
      select p.id, p.name, p.slug, coalesce(v.price, p.base_price) as base_price,
             (select m.url from public.product_media m where m.product_id = p.id and m.kind = 'image' order by m.position limit 1) as image
        into gp
      from public.products p
      join public.product_variants v on v.product_id = p.id and v.kind = 'retail' and v.is_active and not v.is_hidden and v.size_ml = gp_base
      where p.id = pick_txt::uuid and p.is_active and p.archived_at is null and p.stock_unit = 'ml' and not p.is_gift_pack
      limit 1;
      if not found then
        pack_bad := 'One of the perfumes in the ' || gp_title || ' is no longer available. Choose another.';
        exit;
      end if;
      unit_20 := round(gp.base_price * gp_pct / 100);
      pack_total := pack_total + unit_20;
      pack_picks := pack_picks || jsonb_build_object('product_id', gp.id, 'name', gp.name, 'slug', gp.slug, 'image', gp.image, 'price', unit_20);
      pack_need := pack_need || jsonb_build_object('product_id', gp.id, 'ml', gp_size);
    end loop;
    if pack_bad is not null then
      problems := problems || jsonb_build_object('reason', 'UNAVAILABLE', 'name', gp_title, 'key', pk ->> 'key', 'variant_id', gp_variant, 'message', pack_bad);
      continue;
    end if;
    pack_price := round(pack_total * (100 - gp_discount) / 100);
    lines := lines || jsonb_build_object('kind', 'gift_pack', 'key', pk ->> 'key', 'variant_id', gp_variant, 'product_id', gp_product,
      'name', gp_title, 'slug', null, 'label', gp_count || ' × ' || trim_scale(gp_size) || ' ml', 'sku', 'GIFT-PACK', 'size_ml', null,
      'image', nullif(gp_block ->> 'image', ''), 'qty', 1, 'stock', null, 'unit_price', pack_price,
      'compare_at_price', case when pack_price < pack_total then pack_total end, 'line_total', pack_price,
      'picks', pack_picks, 'sample_ml', gp_sample_ml);
    subtotal := subtotal + pack_price;
    item_count := item_count + 1;
  end loop;

  -- Several sizes of one perfume draw from the same liquid: the bag can't need more ml than is left.
  for r in
    select p.name, p.stock_ml, sum(n.ml) as need
    from (
      select (l ->> 'product_id')::uuid as pid, (l ->> 'size_ml')::numeric * (l ->> 'qty')::int as ml
      from jsonb_array_elements(lines) l where nullif(l ->> 'size_ml', '') is not null
      union all
      select (x ->> 'product_id')::uuid, (x ->> 'ml')::numeric from jsonb_array_elements(pack_need) x
    ) n join public.products p on p.id = n.pid
    where p.stock_unit = 'ml'
    group by p.id, p.name, p.stock_ml
    having sum(n.ml) > p.stock_ml
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

create or replace function public.create_order(
  p_address_id uuid,
  p_items jsonb,
  p_coupon_code text default null,
  p_payment_method text default 'COD',
  p_samples jsonb default '[]'::jsonb,
  p_note text default null,
  p_client_ref uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  pm text := upper(coalesce(nullif(trim(p_payment_method), ''), 'COD'));
  q jsonb;
  addr public.addresses;
  prof public.profiles;
  existing public.orders;
  oid uuid;
  onum text;
  line jsonb;
  pos int := 0;
  note text := nullif(trim(coalesce(p_note, '')), '');
  coupon_ok boolean;
  max_open int := app_private.setting_num('cod.max_open_orders', 0)::int;
  open_cod int;
  item_id uuid;
  child record;
  vid uuid;
  gp_size numeric := app_private.setting_num('giftpack.size_ml', 20);
begin
  if uid is null then
    raise exception 'SIGN_IN_REQUIRED: Please sign in to place your order.';
  end if;
  if p_client_ref is not null then
    select * into existing from public.orders where user_id = uid and client_ref = p_client_ref;
    if found then
      return jsonb_build_object('id', existing.id, 'order_number', existing.order_number, 'total', existing.total,
                                'payment_method', existing.payment_method, 'samples_short', existing.samples_short, 'duplicate', true);
    end if;
  end if;
  select * into addr from public.addresses where id = p_address_id and user_id = uid;
  if not found then
    raise exception 'ADDRESS_REQUIRED: Choose a delivery address.';
  end if;
  if pm not in ('COD', 'ONLINE') then
    raise exception 'PAYMENT_METHOD: Choose how you''d like to pay.';
  end if;
  if pm = 'ONLINE' and not app_private.setting_bool('payments.online_enabled', false) then
    raise exception 'PAYMENT_UNAVAILABLE: Online payment isn''t available right now. Choose cash on delivery.';
  end if;
  if note is not null and length(note) > 500 then
    raise exception 'NOTE_TOO_LONG: Keep the note under 500 characters.';
  end if;

  q := app_private.quote(uid, p_items, p_coupon_code, pm, p_samples);
  if jsonb_array_length(q -> 'problems') > 0 then
    raise exception 'OUT_OF_STOCK: %', q -> 'problems' -> 0 ->> 'message';
  end if;
  if jsonb_array_length(q -> 'lines') = 0 then
    raise exception 'EMPTY_BAG: Your bag is empty.';
  end if;
  coupon_ok := coalesce((q -> 'coupon' ->> 'ok')::boolean, false);
  if q -> 'coupon' is not null and jsonb_typeof(q -> 'coupon') = 'object' and not coupon_ok then
    raise exception 'COUPON_INVALID: % Remove it to continue.', q -> 'coupon' ->> 'message';
  end if;
  if pm = 'COD' and not (q -> 'cod' ->> 'allowed')::boolean then
    raise exception 'COD_UNAVAILABLE: %', q -> 'cod' ->> 'message';
  end if;
  if pm = 'COD' and max_open > 0 then
    select count(*) into open_cod from public.orders
    where user_id = uid and payment_method = 'COD' and status in ('PENDING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY');
    if open_cod >= max_open then
      raise exception 'COD_LIMIT: You already have % cash-on-delivery orders on the way. %', open_cod,
        case when app_private.setting_bool('payments.online_enabled', false)
             then 'Pay online for this one, or order again once one of them arrives.'
             else 'Please order again once one of them arrives.' end;
    end if;
  end if;
  -- First-order offers: the phone number on the address must be new to the store too.
  if coupon_ok and app_private.setting_bool('coupons.first_order_phone_check', true)
     and exists (select 1 from public.coupons where id = nullif(q -> 'coupon' ->> 'id', '')::uuid and first_order_only)
     and exists (select 1 from public.orders
                 where customer_phone = addr.phone and user_id is distinct from uid and status <> 'CANCELLED' and replacement_for is null
                   and (payment_method = 'COD' or payment_status not in ('PENDING', 'FAILED'))) then
    raise exception 'COUPON_INVALID: % is a first-order offer, and the phone number on this address has ordered with us before. Remove the code to continue.',
      q -> 'coupon' ->> 'code';
  end if;
  if pm = 'ONLINE' and (q ->> 'total')::numeric < 1 then
    raise exception 'PAYMENT_AMOUNT: Online payment needs a total of at least ₹1.';
  end if;

  select * into prof from public.profiles where id = uid;
  onum := coalesce(nullif(app_private.setting('orders.prefix') #>> '{}', ''), 'SAU-') || nextval('public.order_number_seq');

  perform set_config('app.order_write', 'on', true);
  insert into public.orders (
    order_number, user_id, client_ref, status, payment_method, payment_status, subtotal, discount, shipping_fee, total,
    coupon_code, coupon_id, note, customer_name, customer_email, customer_phone, shipping_address, ship_pincode, ship_state, ship_city,
    samples_entitled, sample_picks)
  values (
    onum, uid, p_client_ref, 'PENDING', pm, 'PENDING', (q ->> 'subtotal')::numeric, (q ->> 'discount')::numeric,
    (q ->> 'shipping')::numeric, (q ->> 'total')::numeric,
    case when coupon_ok then q -> 'coupon' ->> 'code' end,
    case when coupon_ok then nullif(q -> 'coupon' ->> 'id', '')::uuid end,
    note, addr.full_name, coalesce(prof.email, (select email from auth.users where id = uid)), addr.phone,
    jsonb_build_object('full_name', addr.full_name, 'phone', addr.phone, 'line1', addr.line1, 'line2', addr.line2,
                       'landmark', addr.landmark, 'city', addr.city, 'state', addr.state, 'pincode', addr.pincode, 'label', addr.label),
    addr.pincode, addr.state, addr.city, (q -> 'samples' ->> 'entitlement')::int, coalesce(q -> 'samples' -> 'accepted', '[]'::jsonb))
  returning id into oid;

  for line in select e from jsonb_array_elements(q -> 'lines') e loop
    insert into public.order_items (order_id, line_type, product_id, variant_id, product_name, product_slug, variant_label, sku,
      size_ml, image_url, qty, unit_price, compare_at_price, line_total, hsn_code, gst_rate, position)
    select oid, 'item', p.id, (line ->> 'variant_id')::uuid, p.name, p.slug, line ->> 'label', line ->> 'sku',
      nullif(line ->> 'size_ml', '')::numeric, line ->> 'image', (line ->> 'qty')::int, (line ->> 'unit_price')::numeric,
      nullif(line ->> 'compare_at_price', '')::numeric, (line ->> 'line_total')::numeric, p.hsn_code, p.gst_rate, pos
    from public.products p where p.id = (line ->> 'product_id')::uuid
    returning id into item_id;
    pos := pos + 1;
    -- A gift pack lists its perfumes under it; each takes gp_size ml when the stock is taken.
    if line ->> 'kind' = 'gift_pack' then
      for child in
        select (x ->> 'product_id')::uuid as pid, count(*)::int as n from jsonb_array_elements(line -> 'picks') x group by 1
      loop
        vid := app_private.helper_variant(child.pid, 'gift_pack_fill', gp_size);
        insert into public.order_items (order_id, line_type, parent_item_id, product_id, variant_id, product_name, product_slug, variant_label, sku,
          size_ml, image_url, qty, unit_price, line_total, hsn_code, gst_rate, position)
        select oid, 'pack_item', item_id, p.id, vid, p.name, p.slug, trim_scale(gp_size) || ' ml (gift pack)', v.sku, gp_size,
          (select m.url from public.product_media m where m.product_id = p.id and m.kind = 'image' order by m.position limit 1),
          child.n, 0, 0, p.hsn_code, p.gst_rate, pos
        from public.products p join public.product_variants v on v.id = vid where p.id = child.pid;
        pos := pos + 1;
      end loop;
    end if;
  end loop;

  insert into public.order_events (order_id, kind, to_status, message, actor_role)
  values (oid, 'created', 'PENDING', case when pm = 'COD' then 'Order placed · Cash on delivery' else 'Order placed · awaiting online payment' end, 'customer');
  perform set_config('app.order_write', 'off', true);

  if pm = 'COD' then
    perform app_private.reserve_order(oid);
  end if;

  delete from public.carts where user_id = uid;

  return jsonb_build_object('id', oid, 'order_number', onum, 'total', (q ->> 'total')::numeric, 'payment_method', pm,
    'samples_short', (select samples_short from public.orders where id = oid), 'duplicate', false);
end $$;

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
    where i.order_id = p_order and i.line_type = 'item'
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

create or replace function public.save_product(payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  is_new boolean := false;
  pid uuid := nullif(payload ->> 'id', '')::uuid;
  v jsonb;
  m jsonb;
  vid uuid;
  keep_ids uuid[] := '{}';
  old_variant record;
  pos int;
  initial int;
  cid uuid;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can change products.';
  end if;

  begin
    if pid is null then
      if coalesce(nullif(payload ->> 'stock_unit', ''), 'ml') not in ('ml', 'piece') then
        raise exception 'STOCK_UNIT: Choose ml or pieces.';
      end if;
      insert into public.products (slug, name, base_price, stock_unit)
      values (payload ->> 'slug', payload ->> 'name', (payload ->> 'base_price')::numeric, coalesce(nullif(payload ->> 'stock_unit', ''), 'ml'))
      returning id into pid;
      is_new := true;
    end if;
    update public.products set
      slug = payload ->> 'slug',
      name = trim(payload ->> 'name'),
      short_description = nullif(payload ->> 'short_description', ''),
      description = nullif(payload ->> 'description', ''),
      primary_category_id = nullif(payload ->> 'primary_category_id', '')::uuid,
      base_price = (payload ->> 'base_price')::numeric,
      compare_at_price = nullif(payload ->> 'compare_at_price', '')::numeric,
      badge = nullif(payload ->> 'badge', ''),
      concentration_note = nullif(payload ->> 'concentration_note', ''),
      is_featured = coalesce((payload ->> 'is_featured')::boolean, false),
      is_active = coalesce((payload ->> 'is_active')::boolean, false),
      counts_toward_samples = coalesce((payload ->> 'counts_toward_samples')::boolean, true),
      ships_surface_only = coalesce((payload ->> 'ships_surface_only')::boolean, false),
      perfumer = nullif(payload ->> 'perfumer', ''),
      launch_year = nullif(payload ->> 'launch_year', '')::int,
      inspiration = nullif(payload ->> 'inspiration', ''),
      how_to_wear = nullif(payload ->> 'how_to_wear', ''),
      country_of_origin = nullif(payload ->> 'country_of_origin', ''),
      manufacturer_name = nullif(payload ->> 'manufacturer_name', ''),
      manufacturer_address = nullif(payload ->> 'manufacturer_address', ''),
      packer_name = nullif(payload ->> 'packer_name', ''),
      packer_address = nullif(payload ->> 'packer_address', ''),
      importer_name = nullif(payload ->> 'importer_name', ''),
      importer_address = nullif(payload ->> 'importer_address', ''),
      consumer_care = nullif(payload ->> 'consumer_care', ''),
      shelf_life = nullif(payload ->> 'shelf_life', ''),
      ingredients = nullif(payload ->> 'ingredients', ''),
      allergens = nullif(payload ->> 'allergens', ''),
      caution_text = nullif(payload ->> 'caution_text', ''),
      hsn_code = nullif(payload ->> 'hsn_code', ''),
      gst_rate = nullif(payload ->> 'gst_rate', '')::numeric,
      seo_title = nullif(payload ->> 'seo_title', ''),
      seo_description = nullif(payload ->> 'seo_description', ''),
      admin_note = nullif(payload ->> 'admin_note', '')
    where id = pid;
    if not found then
      raise exception 'PRODUCT_NOT_FOUND: This product no longer exists.';
    end if;
  exception when unique_violation then
    raise exception 'SLUG_TAKEN: Another product already uses the link "%". Choose a different one.', payload ->> 'slug';
  end;

  -- variants: update by id, insert new, retire or delete removed
  for v in select * from jsonb_array_elements(coalesce(payload -> 'variants', '[]'::jsonb)) loop
    vid := nullif(v ->> 'id', '')::uuid;
    if vid is not null and exists (select 1 from public.product_variants where id = vid and product_id = pid) then
      keep_ids := keep_ids || vid;
    end if;
  end loop;

  for old_variant in select id, stock, units_sold from public.product_variants where product_id = pid and purpose is null and not (id = any (keep_ids)) loop
    if old_variant.units_sold > 0 then
      if old_variant.stock > 0 and (select stock_unit from public.products where id = pid) = 'piece' then
        perform app_private.apply_stock_change(old_variant.id, -old_variant.stock, 'correction', null, 'Size removed from the product');
      end if;
      update public.product_variants set is_hidden = true, in_sample_pool = false where id = old_variant.id;
    else
      delete from public.product_variants where id = old_variant.id;
    end if;
  end loop;

  pos := 0;
  for v in select * from jsonb_array_elements(coalesce(payload -> 'variants', '[]'::jsonb)) loop
    vid := nullif(v ->> 'id', '')::uuid;
    begin
      if vid is not null and vid = any (keep_ids) then
        update public.product_variants set
          kind = coalesce(v ->> 'kind', 'retail'),
          sku = upper(trim(v ->> 'sku')),
          size_ml = nullif(v ->> 'size_ml', '')::numeric,
          concentration_option_id = nullif(v ->> 'concentration_option_id', '')::uuid,
          label = trim(v ->> 'label'),
          price = nullif(v ->> 'price', '')::numeric,
          compare_at_price = nullif(v ->> 'compare_at_price', '')::numeric,
          weight_g = nullif(v ->> 'weight_g', '')::int,
          length_mm = nullif(v ->> 'length_mm', '')::int,
          width_mm = nullif(v ->> 'width_mm', '')::int,
          height_mm = nullif(v ->> 'height_mm', '')::int,
          is_active = coalesce((v ->> 'is_active')::boolean, true),
          is_hidden = coalesce((v ->> 'is_hidden')::boolean, false),
          in_sample_pool = coalesce((v ->> 'in_sample_pool')::boolean, false),
          position = pos
        where id = vid;
      else
        insert into public.product_variants (
          product_id, kind, sku, size_ml, concentration_option_id, label, price, compare_at_price,
          weight_g, length_mm, width_mm, height_mm, is_active, is_hidden, in_sample_pool, position)
        values (
          pid, coalesce(v ->> 'kind', 'retail'), upper(trim(v ->> 'sku')), nullif(v ->> 'size_ml', '')::numeric,
          nullif(v ->> 'concentration_option_id', '')::uuid, trim(v ->> 'label'), nullif(v ->> 'price', '')::numeric,
          nullif(v ->> 'compare_at_price', '')::numeric, nullif(v ->> 'weight_g', '')::int, nullif(v ->> 'length_mm', '')::int,
          nullif(v ->> 'width_mm', '')::int, nullif(v ->> 'height_mm', '')::int, coalesce((v ->> 'is_active')::boolean, true),
          coalesce((v ->> 'is_hidden')::boolean, false), coalesce((v ->> 'in_sample_pool')::boolean, false), pos)
        returning id into vid;
        initial := coalesce(nullif(v ->> 'initial_stock', '')::int, 0);
        if initial > 0 then
          perform app_private.apply_stock_change(vid, initial, 'initial', null, 'Opening stock');
        end if;
      end if;
    exception when unique_violation then
      raise exception 'SKU_TAKEN: SKU % is already used by another size.', upper(trim(v ->> 'sku'));
    end;
    pos := pos + 1;
  end loop;

  -- media (replace, keep order; variant by id or sku)
  delete from public.product_media where product_id = pid;
  pos := 0;
  for m in select * from jsonb_array_elements(coalesce(payload -> 'media', '[]'::jsonb)) loop
    insert into public.product_media (product_id, variant_id, kind, url, alt, position)
    values (
      pid,
      coalesce(
        (select id from public.product_variants where product_id = pid and id = nullif(m ->> 'variant_id', '')::uuid),
        (select id from public.product_variants where product_id = pid and sku = upper(trim(m ->> 'variant_sku')))),
      coalesce(m ->> 'kind', 'image'), m ->> 'url', nullif(m ->> 'alt', ''), pos);
    pos := pos + 1;
  end loop;

  -- extra categories
  delete from public.product_categories where product_id = pid;
  insert into public.product_categories (product_id, category_id)
    select pid, x::uuid from jsonb_array_elements_text(coalesce(payload -> 'category_ids', '[]'::jsonb)) x
    on conflict do nothing;

  -- collections: keep the order set on the collection page; new memberships go last
  delete from public.product_collections
    where product_id = pid
      and not (collection_id::text in (select jsonb_array_elements_text(coalesce(payload -> 'collection_ids', '[]'::jsonb))));
  for cid in select x::uuid from jsonb_array_elements_text(coalesce(payload -> 'collection_ids', '[]'::jsonb)) x loop
    insert into public.product_collections (product_id, collection_id, position)
      values (pid, cid, coalesce((select max(position) + 1 from public.product_collections where collection_id = cid), 0))
      on conflict do nothing;
  end loop;

  -- notes
  delete from public.product_notes where product_id = pid;
  insert into public.product_notes (product_id, note_id, tier, position)
    select pid, (n ->> 'note_id')::uuid, n ->> 'tier', coalesce(nullif(n ->> 'position', '')::int, ord::int)
    from jsonb_array_elements(coalesce(payload -> 'notes', '[]'::jsonb)) with ordinality as t(n, ord)
    on conflict (product_id, note_id) do nothing;

  -- scent profile
  delete from public.product_attributes where product_id = pid;
  insert into public.product_attributes (product_id, option_id, strength, is_primary)
    select pid, (a ->> 'option_id')::uuid, nullif(a ->> 'strength', '')::int, coalesce((a ->> 'is_primary')::boolean, false)
    from jsonb_array_elements(coalesce(payload -> 'attributes', '[]'::jsonb)) a
    on conflict (product_id, option_id) do nothing;

  -- New perfume: the liquid it starts with (any unit was converted to ml by the editor).
  if is_new and coalesce(nullif(payload ->> 'liquid_ml', '')::numeric, 0) > 0
     and (select stock_unit from public.products where id = pid) = 'ml' then
    perform app_private.apply_liquid_change(pid, (payload ->> 'liquid_ml')::numeric, 'initial', null, 'Opening stock', null, 0);
  end if;
  perform app_private.refresh_product_derived(pid);
  perform app_private.refresh_product_search(pid);
  return pid;
end $$;

-- ============================================================ what the gift pack page needs
-- The rules and every perfume that can go in a pack: active perfumes sold at giftpack.price_base_ml, each with its
-- pack price and how many times it can still be picked from the liquid left.
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
grant execute on function public.gift_pack_options() to anon, authenticated;

-- ============================================================ suggested free samples
-- Checkout fills each free-sample slot with a real pick, chosen the same way as "Surprise me": weighted by what is
-- in stock, avoiding perfumes already in the bag. The customer can swap any of them.
create or replace function public.suggest_samples(p_count int, p_avoid uuid[] default '{}')
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  used uuid[] := '{}';
  picks jsonb := '[]'::jsonb;
  chosen uuid;
  allow_dup boolean := app_private.setting_bool('samples.allow_duplicates', true);
  n int := least(greatest(coalesce(p_count, 0), 0), 10);
begin
  for i in 1..n loop
    chosen := app_private.pick_sample(used, coalesce(p_avoid, '{}'), allow_dup);
    exit when chosen is null;
    used := used || chosen;
    picks := picks || to_jsonb(chosen);
  end loop;
  return picks;
end $$;
grant execute on function public.suggest_samples(int, uuid[]) to anon, authenticated;
