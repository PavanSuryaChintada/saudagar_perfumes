-- 0015_product_page: each product can carry its own product-page sections (accordions), plus store-wide
-- default sections and editable section titles (site block "product_page"). Also: a free-delivery
-- threshold of 0 now means every order ships free, as the settings screen says.

alter table public.products add column if not exists page_sections jsonb not null default '[]'::jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'products_page_sections_array') then
    alter table public.products add constraint products_page_sections_array check (jsonb_typeof(page_sections) = 'array');
  end if;
end $$;
alter table public.products add column if not exists use_default_sections boolean not null default true;

insert into public.site_blocks (key, value) values ('product_page', $q${"profile_title": "Scent Profile", "profile_note": "Longevity and sillage are our own guidance; skin chemistry varies.", "story_title": "The Story", "compliance_title": "Details & Compliance", "delivery_title": "Delivery & Free Samples", "surface_note": "Perfume is shipped by surface courier for safety, which can add a day or two.", "default_sections": [{"title": "How to store your perfume", "body": "<p>Keep the bottle closed, upright and away from direct sunlight and heat. A cool cupboard is ideal.</p>"}]}$q$::jsonb)
on conflict (key) do nothing;

create or replace function public.product_detail(p_slug text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select public.product_card(p.id) || jsonb_build_object(
    'description', p.description,
    'perfumer', p.perfumer,
    'launch_year', p.launch_year,
    'inspiration', p.inspiration,
    'how_to_wear', p.how_to_wear,
    'page_sections', p.page_sections,
    'use_default_sections', p.use_default_sections,
    'ships_surface_only', p.ships_surface_only,
    'seo_title', p.seo_title,
    'seo_description', p.seo_description,
    'compliance', jsonb_build_object(
      'country_of_origin', p.country_of_origin,
      'manufacturer_name', p.manufacturer_name, 'manufacturer_address', p.manufacturer_address,
      'packer_name', p.packer_name, 'packer_address', p.packer_address,
      'importer_name', p.importer_name, 'importer_address', p.importer_address,
      'consumer_care', p.consumer_care, 'shelf_life', p.shelf_life,
      'ingredients', p.ingredients, 'allergens', p.allergens, 'caution_text', p.caution_text,
      'hsn_code', p.hsn_code, 'gst_rate', p.gst_rate),
    'media', coalesce((
      select jsonb_agg(jsonb_build_object('kind', m.kind, 'url', m.url, 'alt', m.alt, 'variant_id', m.variant_id) order by m.position)
      from public.product_media m where m.product_id = p.id), '[]'::jsonb),
    'notes', jsonb_build_object(
      'top', coalesce((select jsonb_agg(jsonb_build_object('name', n.name, 'slug', n.slug, 'image', n.image_url, 'description', n.short_description) order by pn.position)
        from public.product_notes pn join public.notes n on n.id = pn.note_id where pn.product_id = p.id and pn.tier = 'top'), '[]'::jsonb),
      'heart', coalesce((select jsonb_agg(jsonb_build_object('name', n.name, 'slug', n.slug, 'image', n.image_url, 'description', n.short_description) order by pn.position)
        from public.product_notes pn join public.notes n on n.id = pn.note_id where pn.product_id = p.id and pn.tier = 'heart'), '[]'::jsonb),
      'base', coalesce((select jsonb_agg(jsonb_build_object('name', n.name, 'slug', n.slug, 'image', n.image_url, 'description', n.short_description) order by pn.position)
        from public.product_notes pn join public.notes n on n.id = pn.note_id where pn.product_id = p.id and pn.tier = 'base'), '[]'::jsonb)),
    'attributes', coalesce((
      select jsonb_object_agg(kind, items) from (
        select o.kind, jsonb_agg(jsonb_build_object(
          'label', o.label, 'slug', o.slug, 'description', o.description, 'badge', o.badge,
          'strength', pa.strength, 'is_primary', pa.is_primary)
          order by pa.is_primary desc, pa.strength desc nulls last, o.position) as items
        from public.product_attributes pa join public.attribute_options o on o.id = pa.option_id
        where pa.product_id = p.id
        group by o.kind) g), '{}'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('slug', c.slug, 'name', c.name))
      from public.categories c
      where c.id = p.primary_category_id or c.id in (select category_id from public.product_categories where product_id = p.id)), '[]'::jsonb))
  from public.products p
  where p.slug = p_slug and p.is_active and p.archived_at is null;
$$;
grant execute on function public.product_detail(text) to anon, authenticated;

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
                     when cod_min > 0 and total < cod_min then 'COD_MIN' end;

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
      'message', case cod_reason when 'COD_OFF' then 'Cash on delivery is not available right now.'
                                 when 'COD_MIN' then 'Cash on delivery is available on orders of ₹' || trim(to_char(cod_min, 'FM99,99,99,990')) || ' or more.' end),
    'online', jsonb_build_object('allowed', app_private.setting_bool('payments.online_enabled', false)),
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
