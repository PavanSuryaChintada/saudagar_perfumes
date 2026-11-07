-- 0009 CMS: pages + sections, site-wide blocks, announcements, stories, reels, testimonials, FAQs, stockists.

-- ------------------------------------------------------------ pages + sections
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) > 0),
  layout text not null default 'sections' check (layout in ('sections', 'rich_text')),
  body text,
  seo_title text,
  seo_description text,
  og_image text,
  is_published boolean not null default true,
  is_system boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  section_type text not null check (section_type ~ '^[a-z0-9_]+$'),
  label text,
  position int not null default 0,
  is_visible boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists website_sections_page_idx on public.website_sections (page_id, position);

create or replace function public.pages_guard_system()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and old.is_system then
    raise exception 'PAGE_SYSTEM: The % page can''t be deleted. Hide or remove its sections instead.', old.title;
  end if;
  if tg_op = 'UPDATE' and old.is_system and new.slug is distinct from old.slug then
    raise exception 'PAGE_SYSTEM: The % page''s link can''t change.', old.title;
  end if;
  if tg_op = 'UPDATE' and old.is_system then
    new.is_system := true;
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists pages_guard_system on public.pages;
create trigger pages_guard_system before update or delete on public.pages
  for each row execute function public.pages_guard_system();

-- ------------------------------------------------------------ site-wide blocks (theme, brand, header, footer…)
create table if not exists public.site_blocks (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null
);

-- ------------------------------------------------------------ lists
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  text text not null check (length(trim(text)) > 0),
  link jsonb,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at is null or ends_at is null or ends_at > starts_at)
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  subtitle text,
  tag text,
  image_url text,
  video_url text,
  duration_ms int not null default 5000 check (duration_ms between 1000 and 60000),
  product_id uuid references public.products (id) on delete set null,
  is_active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  caption text,
  video_url text,
  thumbnail_url text,
  external_url text,
  is_active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.reel_products (
  reel_id uuid not null references public.reels (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  position int not null default 0,
  primary key (reel_id, product_id)
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null check (length(trim(quote)) > 0),
  name text not null check (length(trim(name)) > 0),
  location text,
  rating int check (rating is null or rating between 1 and 5),
  product_id uuid references public.products (id) on delete set null,
  is_active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null check (length(trim(question)) > 0),
  answer text not null,
  group_name text,
  is_active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stockists (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  city text,
  address text,
  phone text,
  hours text,
  map_url text,
  image_url text,
  is_active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['pages', 'website_sections', 'announcements', 'stories', 'reels', 'testimonials', 'faqs', 'stockists'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;
drop trigger if exists site_blocks_stamp on public.site_blocks;
create trigger site_blocks_stamp before update on public.site_blocks for each row execute function public.settings_stamp();

-- ------------------------------------------------------------ RLS
alter table public.pages enable row level security;
alter table public.website_sections enable row level security;
alter table public.site_blocks enable row level security;
alter table public.announcements enable row level security;
alter table public.stories enable row level security;
alter table public.reels enable row level security;
alter table public.reel_products enable row level security;
alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;
alter table public.stockists enable row level security;

drop policy if exists pages_read on public.pages;
create policy pages_read on public.pages for select to anon, authenticated using (is_published or public.is_admin());

create or replace function public.page_is_published(pid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.pages where id = pid and is_published);
$$;
grant execute on function public.page_is_published(uuid) to anon, authenticated;

drop policy if exists website_sections_read on public.website_sections;
create policy website_sections_read on public.website_sections for select to anon, authenticated
  using ((is_visible and public.page_is_published(page_id)) or public.is_admin());

drop policy if exists site_blocks_read on public.site_blocks;
create policy site_blocks_read on public.site_blocks for select to anon, authenticated using (true);

drop policy if exists reel_products_read on public.reel_products;
create policy reel_products_read on public.reel_products for select to anon, authenticated using (true);

do $$
declare t text;
begin
  foreach t in array array['announcements', 'stories', 'reels', 'testimonials', 'faqs', 'stockists'] loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (is_active or public.is_admin())', t || '_read', t);
  end loop;
  foreach t in array array['pages', 'website_sections', 'site_blocks', 'announcements', 'stories', 'reels', 'reel_products', 'testimonials', 'faqs', 'stockists'] loop
    execute format('drop policy if exists %I on public.%I', t || '_admin', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_admin', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- ------------------------------------------------------------ RPCs
-- A page and its visible sections, in order. Unpublished pages are visible to admins only (preview).
create or replace function public.page_content(p_slug text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'id', p.id, 'slug', p.slug, 'title', p.title, 'layout', p.layout, 'body', p.body,
    'seo_title', p.seo_title, 'seo_description', p.seo_description, 'og_image', p.og_image, 'is_published', p.is_published,
    'sections', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'type', s.section_type, 'config', s.config) order by s.position, s.created_at)
      from public.website_sections s where s.page_id = p.id and s.is_visible), '[]'::jsonb))
  from public.pages p
  where p.slug = p_slug;
$$;
grant execute on function public.page_content(text) to anon, authenticated;

create or replace function public.duplicate_section(p_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare src public.website_sections; new_id uuid;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN: Only admins can change pages.'; end if;
  select * into src from public.website_sections where id = p_id;
  if not found then raise exception 'SECTION_NOT_FOUND: That section no longer exists.'; end if;
  update public.website_sections set position = position + 1 where page_id = src.page_id and position > src.position;
  insert into public.website_sections (page_id, section_type, label, position, is_visible, config)
    values (src.page_id, src.section_type, src.label, src.position + 1, src.is_visible, src.config)
    returning id into new_id;
  return new_id;
end $$;
grant execute on function public.duplicate_section(uuid) to authenticated;

create or replace function public.reorder_rows(p_table text, p_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can reorder.';
  end if;
  if p_table not in ('attribute_options', 'categories', 'collections', 'notes', 'product_media', 'product_variants',
                     'pages', 'website_sections', 'announcements', 'stories', 'reels', 'testimonials', 'faqs', 'stockists') then
    raise exception 'REORDER_TABLE: % cannot be reordered.', p_table;
  end if;
  execute format(
    'update public.%I t set position = o.ord - 1 from unnest($1) with ordinality as o(id, ord) where t.id = o.id',
    p_table) using p_ids;
end $$;

-- One round trip for first paint: public settings, every site block, live announcements.
create or replace function public.site_bootstrap()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'settings', coalesce((select jsonb_object_agg(key, value) from public.settings where is_public), '{}'::jsonb),
    'blocks', coalesce((select jsonb_object_agg(key, value) from public.site_blocks), '{}'::jsonb),
    'announcements', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'text', a.text, 'link', a.link) order by a.position)
      from public.announcements a
      where a.is_active and (a.starts_at is null or a.starts_at <= now()) and (a.ends_at is null or a.ends_at > now())), '[]'::jsonb)
  );
$$;
grant execute on function public.site_bootstrap() to anon, authenticated;
