-- 0004 Catalog: options, categories, collections, notes, products, variants, media, joins, stock path, save_product.
-- Idempotent. Never edit after it has been applied — add a new migration instead.

-- ============================================================ scent-profile options
create table if not exists public.attribute_options (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in (
    'family', 'note_family', 'accord', 'concentration', 'intensity', 'longevity',
    'sillage', 'season', 'time_of_day', 'occasion', 'gender')),
  label text not null check (length(trim(label)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  badge text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, slug)
);
create unique index if not exists attribute_options_kind_label_ci on public.attribute_options (kind, lower(label));

-- ============================================================ categories (tree)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  description text,
  image_url text,
  video_url text,
  position int not null default 0,
  is_active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.categories_no_loop()
returns trigger language plpgsql set search_path = '' as $$
declare cursor_id uuid := new.parent_id; depth int := 0;
begin
  while cursor_id is not null loop
    if cursor_id = new.id then
      raise exception 'CATEGORY_LOOP: A category cannot sit inside itself or one of its own sub-categories.';
    end if;
    select parent_id into cursor_id from public.categories where id = cursor_id;
    depth := depth + 1;
    if depth > 50 then exit; end if;
  end loop;
  return new;
end $$;
drop trigger if exists categories_no_loop on public.categories;
create trigger categories_no_loop before insert or update of parent_id on public.categories
  for each row execute function public.categories_no_loop();

-- ============================================================ collections
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  short_name text,
  headline text,
  tagline text,
  descriptor text,
  notes_subtitle text,
  image_url text,
  hero_video_url text,
  hero_poster_url text,
  hero_badge text,
  hero_title text,
  hero_tagline text,
  hero_subtext text,
  hero_accent_tag text,
  aliases text[] not null default '{}',
  position int not null default 0,
  is_active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists collections_aliases_idx on public.collections using gin (aliases);

-- ============================================================ notes
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  family_option_id uuid references public.attribute_options (id) on delete set null,
  short_description text,
  image_url text,
  is_active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists notes_name_ci on public.notes (lower(name));

create or replace function public.notes_family_kind()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.family_option_id is not null
     and (select kind from public.attribute_options where id = new.family_option_id) is distinct from 'note_family' then
    raise exception 'NOTE_FAMILY: A note''s family must be one of the note families.';
  end if;
  return new;
end $$;
drop trigger if exists notes_family_kind on public.notes;
create trigger notes_family_kind before insert or update of family_option_id on public.notes
  for each row execute function public.notes_family_kind();

-- ============================================================ products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  short_description text,
  description text,
  primary_category_id uuid references public.categories (id) on delete set null,
  base_price numeric(12, 2) not null check (base_price >= 0),
  compare_at_price numeric(12, 2) check (compare_at_price is null or compare_at_price >= 0),
  badge text,
  concentration_note text,
  is_featured boolean not null default false,
  is_active boolean not null default false,
  archived_at timestamptz,
  counts_toward_samples boolean not null default true,
  ships_surface_only boolean not null default false,
  -- story
  perfumer text,
  launch_year int check (launch_year is null or launch_year between 1900 and 2100),
  inspiration text,
  how_to_wear text,
  -- compliance (Legal Metrology); defaults come from settings in the admin form
  country_of_origin text default 'India',
  manufacturer_name text,
  manufacturer_address text,
  packer_name text,
  packer_address text,
  importer_name text,
  importer_address text,
  consumer_care text,
  shelf_life text,
  ingredients text,
  allergens text,
  caution_text text,
  hsn_code text default '3303',
  gst_rate numeric(5, 2) default 18 check (gst_rate is null or gst_rate between 0 and 100),
  -- seo + admin
  seo_title text,
  seo_description text,
  admin_note text,
  -- derived (written only by internal functions)
  total_stock int not null default 0,
  available_sizes numeric[] not null default '{}',
  min_price numeric(12, 2),
  max_price numeric(12, 2),
  units_sold int not null default 0,
  rating_avg numeric(3, 2) not null default 0,
  rating_count int not null default 0,
  search_text text,
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_active_idx on public.products (is_active, archived_at);
create index if not exists products_search_idx on public.products using gin (search_vector);
create index if not exists products_search_trgm_idx on public.products using gin (search_text extensions.gin_trgm_ops);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  kind text not null default 'retail' check (kind in ('retail', 'sample')),
  sku text not null unique check (length(trim(sku)) > 0),
  size_ml numeric(6, 1) check (size_ml is null or size_ml > 0),
  concentration_option_id uuid references public.attribute_options (id) on delete set null,
  label text not null check (length(trim(label)) > 0),
  price numeric(12, 2) check (price is null or price >= 0),
  compare_at_price numeric(12, 2) check (compare_at_price is null or compare_at_price >= 0),
  stock int not null default 0 check (stock >= 0),
  weight_g int check (weight_g is null or weight_g > 0),
  length_mm int,
  width_mm int,
  height_mm int,
  is_active boolean not null default true,
  is_hidden boolean not null default false,
  in_sample_pool boolean not null default false,
  position int not null default 0,
  units_sold int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_variants_product_idx on public.product_variants (product_id);

create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  kind text not null default 'image' check (kind in ('image', 'video')),
  url text not null,
  alt text,
  position int not null default 0
);
create index if not exists product_media_product_idx on public.product_media (product_id, position);

create table if not exists public.product_categories (
  product_id uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (product_id, category_id)
);
create table if not exists public.product_collections (
  product_id uuid not null references public.products (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  position int not null default 0,
  primary key (product_id, collection_id)
);
create table if not exists public.product_notes (
  product_id uuid not null references public.products (id) on delete cascade,
  note_id uuid not null references public.notes (id) on delete cascade,
  tier text not null check (tier in ('top', 'heart', 'base')),
  position int not null default 0,
  primary key (product_id, note_id)
);
create table if not exists public.product_attributes (
  product_id uuid not null references public.products (id) on delete cascade,
  option_id uuid not null references public.attribute_options (id) on delete cascade,
  strength int check (strength is null or strength between 1 and 100),
  is_primary boolean not null default false,
  primary key (product_id, option_id)
);
create index if not exists product_notes_note_idx on public.product_notes (note_id);
create index if not exists product_attributes_option_idx on public.product_attributes (option_id);
create index if not exists product_collections_collection_idx on public.product_collections (collection_id, position);
create index if not exists product_categories_category_idx on public.product_categories (category_id);

create table if not exists public.inventory_movements (
  id bigint generated always as identity primary key,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  delta int not null,
  stock_after int not null,
  reason text not null,
  order_id uuid,
  note text,
  actor uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists inventory_movements_variant_idx on public.inventory_movements (variant_id, created_at desc);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['attribute_options', 'categories', 'collections', 'notes', 'products', 'product_variants'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;

-- ============================================================ guards on derived values and stock
-- Derived columns change only inside internal functions that set app.derived_write = 'on' for the transaction.
create or replace function public.products_guard_derived()
returns trigger language plpgsql set search_path = '' as $$
begin
  if coalesce(current_setting('app.derived_write', true), '') <> 'on' then
    new.total_stock := old.total_stock;
    new.available_sizes := old.available_sizes;
    new.min_price := old.min_price;
    new.max_price := old.max_price;
    new.units_sold := old.units_sold;
    new.rating_avg := old.rating_avg;
    new.rating_count := old.rating_count;
    new.search_text := old.search_text;
    new.search_vector := old.search_vector;
  end if;
  return new;
end $$;
drop trigger if exists products_guard_derived on public.products;
create trigger products_guard_derived before update on public.products
  for each row execute function public.products_guard_derived();

create or replace function public.variants_guard_stock()
returns trigger language plpgsql set search_path = '' as $$
begin
  if coalesce(current_setting('app.stock_write', true), '') <> 'on' then
    if tg_op = 'INSERT' and new.stock <> 0 then
      raise exception 'STOCK_DIRECT_WRITE: New sizes start at 0 stock. Add stock with a reason instead.';
    end if;
    if tg_op = 'UPDATE' and new.stock is distinct from old.stock then
      raise exception 'STOCK_DIRECT_WRITE: Stock can only change through Add/Remove stock, so every change is logged.';
    end if;
  end if;
  if tg_op = 'UPDATE' and coalesce(current_setting('app.derived_write', true), '') <> 'on' then
    new.units_sold := old.units_sold;
  end if;
  return new;
end $$;
drop trigger if exists variants_guard_stock on public.product_variants;
create trigger variants_guard_stock before insert or update on public.product_variants
  for each row execute function public.variants_guard_stock();

-- ============================================================ derived product fields
create or replace function app_private.refresh_product_derived(pid uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('app.derived_write', 'on', true);
  update public.products p set
    total_stock = coalesce((
      select sum(v.stock) from public.product_variants v
      where v.product_id = p.id and v.kind = 'retail' and v.is_active and not v.is_hidden), 0),
    available_sizes = coalesce(array(
      select distinct v.size_ml from public.product_variants v
      where v.product_id = p.id and v.kind = 'retail' and v.is_active and not v.is_hidden and v.size_ml is not null
      order by v.size_ml), '{}'),
    min_price = (
      select min(coalesce(v.price, p.base_price)) from public.product_variants v
      where v.product_id = p.id and v.kind = 'retail' and v.is_active and not v.is_hidden),
    max_price = (
      select max(coalesce(v.price, p.base_price)) from public.product_variants v
      where v.product_id = p.id and v.kind = 'retail' and v.is_active and not v.is_hidden)
  where p.id = pid;
  perform set_config('app.derived_write', 'off', true);
end $$;

create or replace function app_private.refresh_product_search(pid uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  head text; notes_text text; rest text;
begin
  select concat_ws(' ', p.name, p.badge) into head from public.products p where p.id = pid;
  if head is null then return; end if;
  select string_agg(concat_ws(' ', n.name, fo.label), ' ') into notes_text
    from public.product_notes pn
    join public.notes n on n.id = pn.note_id
    left join public.attribute_options fo on fo.id = n.family_option_id
    where pn.product_id = pid;
  select concat_ws(' ',
      p.short_description, p.concentration_note,
      (select c.name from public.categories c where c.id = p.primary_category_id),
      (select string_agg(c.name, ' ') from public.product_categories pc join public.categories c on c.id = pc.category_id where pc.product_id = pid),
      (select string_agg(c.name, ' ') from public.product_collections pc join public.collections c on c.id = pc.collection_id where pc.product_id = pid),
      (select string_agg(o.label, ' ') from public.product_attributes pa join public.attribute_options o on o.id = pa.option_id where pa.product_id = pid))
    into rest from public.products p where p.id = pid;
  perform set_config('app.derived_write', 'on', true);
  update public.products set
    search_text = lower(concat_ws(' ', head, notes_text, rest)),
    search_vector =
      setweight(to_tsvector('simple', extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(head, ''))), 'A') ||
      setweight(to_tsvector('simple', extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(notes_text, ''))), 'B') ||
      setweight(to_tsvector('simple', extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(rest, ''))), 'C')
  where id = pid;
  perform set_config('app.derived_write', 'off', true);
end $$;

create or replace function public.variants_after_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then perform app_private.refresh_product_derived(old.product_id); end if;
  if tg_op in ('INSERT', 'UPDATE') and (tg_op = 'INSERT' or new.product_id <> old.product_id) then
    perform app_private.refresh_product_derived(new.product_id);
  end if;
  return null;
end $$;
drop trigger if exists variants_after_change on public.product_variants;
create trigger variants_after_change after insert or update or delete on public.product_variants
  for each row execute function public.variants_after_change();

create or replace function public.products_after_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.base_price is distinct from old.base_price then
    perform app_private.refresh_product_derived(new.id);
  end if;
  if tg_op = 'INSERT'
     or new.name is distinct from old.name
     or new.badge is distinct from old.badge
     or new.short_description is distinct from old.short_description
     or new.concentration_note is distinct from old.concentration_note
     or new.primary_category_id is distinct from old.primary_category_id then
    perform app_private.refresh_product_search(new.id);
  end if;
  return null;
end $$;
drop trigger if exists products_after_change on public.products;
create trigger products_after_change after insert or update on public.products
  for each row execute function public.products_after_change();

create or replace function public.product_links_after_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then perform app_private.refresh_product_search(old.product_id); end if;
  if tg_op in ('INSERT', 'UPDATE') then perform app_private.refresh_product_search(new.product_id); end if;
  return null;
end $$;
do $$
declare t text;
begin
  foreach t in array array['product_notes', 'product_collections', 'product_categories', 'product_attributes'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_search', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.product_links_after_change()', t || '_search', t);
  end loop;
end $$;

-- Renaming a note, option, collection or category refreshes the products that use it.
create or replace function public.catalog_labels_after_rename()
returns trigger language plpgsql security definer set search_path = '' as $$
declare pid uuid;
begin
  if tg_table_name = 'notes' then
    for pid in select product_id from public.product_notes where note_id = new.id loop perform app_private.refresh_product_search(pid); end loop;
  elsif tg_table_name = 'attribute_options' then
    for pid in select product_id from public.product_attributes where option_id = new.id
               union select pn.product_id from public.product_notes pn join public.notes n on n.id = pn.note_id where n.family_option_id = new.id loop
      perform app_private.refresh_product_search(pid);
    end loop;
  elsif tg_table_name = 'collections' then
    for pid in select product_id from public.product_collections where collection_id = new.id loop perform app_private.refresh_product_search(pid); end loop;
  elsif tg_table_name = 'categories' then
    for pid in select product_id from public.product_categories where category_id = new.id
               union select id from public.products where primary_category_id = new.id loop
      perform app_private.refresh_product_search(pid);
    end loop;
  end if;
  return null;
end $$;
drop trigger if exists notes_rename on public.notes;
create trigger notes_rename after update of name, family_option_id on public.notes for each row execute function public.catalog_labels_after_rename();
drop trigger if exists attribute_options_rename on public.attribute_options;
create trigger attribute_options_rename after update of label on public.attribute_options for each row execute function public.catalog_labels_after_rename();
drop trigger if exists collections_rename on public.collections;
create trigger collections_rename after update of name on public.collections for each row execute function public.catalog_labels_after_rename();
drop trigger if exists categories_rename on public.categories;
create trigger categories_rename after update of name on public.categories for each row execute function public.catalog_labels_after_rename();

-- ============================================================ the one stock path
create or replace function app_private.apply_stock_change(
  p_variant uuid, p_delta int, p_reason text, p_order uuid default null, p_note text default null)
returns int language plpgsql security definer set search_path = '' as $$
declare cur int; nxt int; vlabel text;
begin
  if p_reason not in ('order', 'cancel_restock', 'return_restock', 'restock', 'damaged', 'tester_sample_use',
                      'write_off', 'correction', 'initial') then
    raise exception 'STOCK_REASON: "%" is not a stock change reason.', p_reason;
  end if;
  if p_delta = 0 then
    select stock into cur from public.product_variants where id = p_variant;
    return cur;
  end if;
  select v.stock, p.name || ' · ' || v.label into cur, vlabel
    from public.product_variants v join public.products p on p.id = v.product_id
    where v.id = p_variant for update of v;
  if not found then
    raise exception 'VARIANT_NOT_FOUND: That size no longer exists.';
  end if;
  nxt := cur + p_delta;
  if nxt < 0 then
    raise exception 'STOCK_NEGATIVE: % has only % in stock.', vlabel, cur;
  end if;
  perform set_config('app.stock_write', 'on', true);
  update public.product_variants set stock = nxt where id = p_variant;
  perform set_config('app.stock_write', 'off', true);
  insert into public.inventory_movements (variant_id, delta, stock_after, reason, order_id, note)
    values (p_variant, p_delta, nxt, p_reason, p_order, nullif(trim(coalesce(p_note, '')), ''));
  return nxt;
end $$;

create or replace function public.adjust_stock(p_variant uuid, p_delta int, p_reason text, p_note text default null)
returns int language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can change stock.';
  end if;
  return app_private.apply_stock_change(p_variant, p_delta, p_reason, null, p_note);
end $$;
grant execute on function public.adjust_stock(uuid, int, text, text) to authenticated;

-- ============================================================ product save / archive / delete / duplicate
create or replace function public.save_product(payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
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
      insert into public.products (slug, name, base_price) values (payload ->> 'slug', payload ->> 'name', (payload ->> 'base_price')::numeric)
      returning id into pid;
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

  for old_variant in select id, stock, units_sold from public.product_variants where product_id = pid and not (id = any (keep_ids)) loop
    if old_variant.units_sold > 0 then
      if old_variant.stock > 0 then
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

  perform app_private.refresh_product_derived(pid);
  perform app_private.refresh_product_search(pid);
  return pid;
end $$;
grant execute on function public.save_product(jsonb) to authenticated;

create or replace function public.archive_product(p_id uuid, p_archived boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN: Only admins can change products.'; end if;
  if p_archived then
    update public.products set archived_at = now(), is_active = false where id = p_id;
  else
    update public.products set archived_at = null where id = p_id;
  end if;
end $$;
grant execute on function public.archive_product(uuid, boolean) to authenticated;

create or replace function public.delete_product(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN: Only admins can change products.'; end if;
  if exists (select 1 from public.products where id = p_id and units_sold > 0)
     or exists (select 1 from public.product_variants where product_id = p_id and units_sold > 0) then
    raise exception 'PRODUCT_SOLD: This product has been ordered before, so it can''t be deleted. Archive it instead.';
  end if;
  delete from public.products where id = p_id;
end $$;
grant execute on function public.delete_product(uuid) to authenticated;

create or replace function public.duplicate_product(p_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  src public.products;
  new_id uuid;
  new_slug text;
  n int := 1;
  vmap jsonb := '{}'::jsonb;
  v record;
  nv uuid;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN: Only admins can change products.'; end if;
  select * into src from public.products where id = p_id;
  if not found then raise exception 'PRODUCT_NOT_FOUND: This product no longer exists.'; end if;
  new_slug := src.slug || '-copy';
  while exists (select 1 from public.products where slug = new_slug) loop
    n := n + 1;
    new_slug := src.slug || '-copy-' || n;
  end loop;
  insert into public.products (
    slug, name, short_description, description, primary_category_id, base_price, compare_at_price, badge, concentration_note,
    is_featured, is_active, counts_toward_samples, ships_surface_only, perfumer, launch_year, inspiration, how_to_wear,
    country_of_origin, manufacturer_name, manufacturer_address, packer_name, packer_address, importer_name, importer_address,
    consumer_care, shelf_life, ingredients, allergens, caution_text, hsn_code, gst_rate, seo_title, seo_description, admin_note)
  values (
    new_slug, src.name || ' (copy)', src.short_description, src.description, src.primary_category_id, src.base_price,
    src.compare_at_price, src.badge, src.concentration_note, false, false, src.counts_toward_samples, src.ships_surface_only,
    src.perfumer, src.launch_year, src.inspiration, src.how_to_wear, src.country_of_origin, src.manufacturer_name,
    src.manufacturer_address, src.packer_name, src.packer_address, src.importer_name, src.importer_address, src.consumer_care,
    src.shelf_life, src.ingredients, src.allergens, src.caution_text, src.hsn_code, src.gst_rate, src.seo_title,
    src.seo_description, src.admin_note)
  returning id into new_id;
  for v in select * from public.product_variants where product_id = p_id and not is_hidden order by position loop
    insert into public.product_variants (product_id, kind, sku, size_ml, concentration_option_id, label, price, compare_at_price,
      weight_g, length_mm, width_mm, height_mm, is_active, is_hidden, in_sample_pool, position)
    values (new_id, v.kind, v.sku || '-COPY' || case when n > 1 then n::text else '' end, v.size_ml, v.concentration_option_id,
      v.label, v.price, v.compare_at_price, v.weight_g, v.length_mm, v.width_mm, v.height_mm, v.is_active, false,
      v.in_sample_pool, v.position)
    returning id into nv;
    vmap := vmap || jsonb_build_object(v.id::text, nv);
  end loop;
  insert into public.product_media (product_id, variant_id, kind, url, alt, position)
    select new_id, nullif(vmap ->> m.variant_id::text, '')::uuid, m.kind, m.url, m.alt, m.position
    from public.product_media m where m.product_id = p_id;
  insert into public.product_categories select new_id, category_id from public.product_categories where product_id = p_id;
  insert into public.product_notes select new_id, note_id, tier, position from public.product_notes where product_id = p_id;
  insert into public.product_attributes select new_id, option_id, strength, is_primary from public.product_attributes where product_id = p_id;
  perform app_private.refresh_product_search(new_id);
  return new_id;
end $$;
grant execute on function public.duplicate_product(uuid) to authenticated;

-- ============================================================ row-level security
create or replace function public.product_is_visible(pid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.products where id = pid and is_active and archived_at is null);
$$;
grant execute on function public.product_is_visible(uuid) to anon, authenticated;

alter table public.attribute_options enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.notes enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_media enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_collections enable row level security;
alter table public.product_notes enable row level security;
alter table public.product_attributes enable row level security;
alter table public.inventory_movements enable row level security;

do $$
declare t text;
begin
  -- simple content tables: read active, admins write
  foreach t in array array['attribute_options', 'categories', 'collections', 'notes'] loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (is_active or public.is_admin())', t || '_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_admin', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
  -- product link tables: visible with their product
  foreach t in array array['product_media', 'product_categories', 'product_collections', 'product_notes', 'product_attributes'] loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (public.product_is_visible(product_id) or public.is_admin())', t || '_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_admin', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

drop policy if exists products_read on public.products;
create policy products_read on public.products for select to anon, authenticated
  using ((is_active and archived_at is null) or public.is_admin());
drop policy if exists products_admin on public.products;
create policy products_admin on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

drop policy if exists product_variants_read on public.product_variants;
create policy product_variants_read on public.product_variants for select to anon, authenticated
  using ((is_active and not is_hidden and public.product_is_visible(product_id)) or public.is_admin());
drop policy if exists product_variants_admin on public.product_variants;
create policy product_variants_admin on public.product_variants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select on public.product_variants to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;

drop policy if exists inventory_movements_admin_read on public.inventory_movements;
create policy inventory_movements_admin_read on public.inventory_movements for select to authenticated
  using (public.is_admin());
grant select on public.inventory_movements to authenticated;
