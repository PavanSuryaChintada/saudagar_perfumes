-- 0001 Foundation: roles, profiles, addresses, settings, bootstrap.
-- Idempotent. Never edit after it has been applied — add a new migration instead.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

-- ---------------------------------------------------------------- helpers
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Same rules as src/lib/phone.ts normalizeIndianPhone: strip non-digits, drop a leading 91 or 0,
-- accept only 10 digits starting 6-9.
create or replace function public.normalize_indian_phone(input text)
returns text language plpgsql immutable set search_path = '' as $$
declare d text;
begin
  if input is null then return null; end if;
  d := regexp_replace(input, '[^0-9]', '', 'g');
  if length(d) = 12 and left(d, 2) = '91' then d := substr(d, 3); end if;
  if length(d) = 11 and left(d, 1) = '0' then d := substr(d, 2); end if;
  if d ~ '^[6-9][0-9]{9}$' then return d; end if;
  return null;
end $$;

-- ---------------------------------------------------------------- roles
do $$ begin
  create type public.app_role as enum ('admin', 'customer');
exception when duplicate_object then null;
end $$;

create table if not exists public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_uid uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = _uid and role = _role);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.has_role(auth.uid(), 'admin'), false);
$$;

grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists user_roles_admin_write on public.user_roles;
create policy user_roles_admin_write on public.user_roles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.user_roles to authenticated;

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text check (phone is null or phone ~ '^[6-9][0-9]{9}$'),
  date_of_birth date,
  dob_locked boolean not null default false,
  whatsapp_opt_in boolean not null default false,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Customers may edit their name, phone, opt-ins and set their DOB once. Email and the lock are theirs to keep.
create or replace function public.profiles_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  new.email := old.email;
  new.dob_locked := old.dob_locked;
  if new.date_of_birth is distinct from old.date_of_birth then
    if old.dob_locked then
      raise exception 'DOB_LOCKED: Date of birth can only be set once. Contact us to correct it.';
    end if;
    if new.date_of_birth is not null then
      new.dob_locked := true;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
grant select, update on public.profiles to authenticated;

-- Signup: profile + customer role. Later migrations extend this (welcome coupon, notifications).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    public.normalize_indian_phone(new.raw_user_meta_data ->> 'phone')
  )
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'customer') on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- addresses
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null default 'Home' check (label in ('Home', 'Work', 'Other')),
  full_name text not null check (length(trim(full_name)) > 0),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  line1 text not null check (length(trim(line1)) > 0),
  line2 text,
  landmark text,
  city text not null check (length(trim(city)) > 0),
  state text not null check (length(trim(state)) > 0),
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists addresses_user_idx on public.addresses (user_id);
alter table public.addresses enable row level security;

drop trigger if exists addresses_updated_at on public.addresses;
create trigger addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

create or replace function public.addresses_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and not exists (select 1 from public.addresses where user_id = new.user_id) then
    new.is_default := true;
  end if;
  return new;
end $$;

create or replace function public.addresses_after_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.is_default then
      update public.addresses set is_default = true
      where id = (select id from public.addresses where user_id = old.user_id order by created_at desc limit 1);
    end if;
    return old;
  end if;
  if new.is_default then
    update public.addresses set is_default = false
    where user_id = new.user_id and id <> new.id and is_default;
  end if;
  return new;
end $$;

drop trigger if exists addresses_before_write on public.addresses;
create trigger addresses_before_write before insert on public.addresses
  for each row execute function public.addresses_before_write();
drop trigger if exists addresses_after_write on public.addresses;
create trigger addresses_after_write after insert or update of is_default or delete on public.addresses
  for each row execute function public.addresses_after_write();

drop policy if exists addresses_own on public.addresses;
create policy addresses_own on public.addresses for all to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
grant select, insert, update, delete on public.addresses to authenticated;

-- ---------------------------------------------------------------- settings
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.settings enable row level security;

create or replace function public.settings_stamp()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;
drop trigger if exists settings_stamp on public.settings;
create trigger settings_stamp before update on public.settings
  for each row execute function public.settings_stamp();

drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings for select to anon, authenticated
  using (is_public or public.is_admin());
drop policy if exists settings_admin_write on public.settings;
create policy settings_admin_write on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select on public.settings to anon;
grant select, insert, update, delete on public.settings to authenticated;

insert into public.settings (key, value, is_public, description) values
  ('store.name', '"Saudagar Perfumes"', true, 'Store name used in titles and emails'),
  ('shipping.fee', '250', true, 'Standard delivery fee in rupees'),
  ('shipping.free_threshold', '4999', true, 'Orders at or above this (after discount) ship free'),
  ('shipping.default_eta', '{"min": 3, "max": 7}', true, 'Delivery estimate in days when no courier answer is available'),
  ('cod.enabled', 'true', true, 'Allow cash on delivery'),
  ('cod.min_order', '0', true, 'Minimum order for cash on delivery (0 = none)'),
  ('returns.window_days', '7', true, 'Days after delivery a return can be requested'),
  ('samples.enabled', 'true', true, 'Free sample programme on/off'),
  ('samples.ml_per_sample', '50', true, 'Every this many ml of eligible perfume earns one sample'),
  ('samples.sample_size_ml', '5', true, 'Sample vial size shown to customers'),
  ('samples.max_per_order', '4', true, 'Most samples one order can earn'),
  ('samples.allow_duplicates', 'true', true, 'Customer may pick the same scent more than once'),
  ('payments.online_enabled', 'false', true, 'Online payment (Razorpay) on/off'),
  ('auth.google_enabled', 'false', true, 'Show Google sign-in'),
  ('media.transforms_enabled', 'false', true, 'Use Supabase image transformations (Pro plan)'),
  ('whatsapp.floating_number', '""', true, 'WhatsApp number for the floating chat button'),
  ('analytics.ga4_id', '""', true, 'Google Analytics 4 measurement ID'),
  ('analytics.gtm_id', '""', true, 'Google Tag Manager container ID'),
  ('inventory.low_stock_threshold', '5', false, 'Variants at or below this stock are flagged'),
  ('orders.prefix', '"SAU-"', false, 'Prefix for order numbers'),
  ('whatsapp.enabled', 'false', false, 'Send WhatsApp messages (Meta Cloud API)')
on conflict (key) do nothing;

-- ---------------------------------------------------------------- bootstrap
-- One round trip for first paint. Later migrations replace this to add brand, theme, navigation, etc.
create or replace function public.site_bootstrap()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'settings', coalesce((select jsonb_object_agg(key, value) from public.settings where is_public), '{}'::jsonb)
  );
$$;
grant execute on function public.site_bootstrap() to anon, authenticated;
