-- 0016_coupons: general, welcome and birthday coupons; the evaluation function used by the quote,
-- the "apply coupon" list, redemption at COD order placement (released on cancel), the welcome code
-- issued at signup, and birthday codes released by the admin.

-- ============================================================ settings
insert into public.settings (key, value, is_public, description) values
  ('welcome.enabled', 'true', false, 'Give every new customer a personal welcome code'),
  ('welcome.prefix', '"WELCOME"', false, 'Welcome codes look like PREFIX-ABC123'),
  ('welcome.valid_days', '30', false, 'Days a welcome code stays valid'),
  ('welcome.min_order', '0', false, 'Minimum eligible order for the welcome code (0 = none)'),
  ('welcome.max_discount', '0', false, 'Largest discount a welcome code can give (0 = no cap)'),
  ('welcome.first_order_only', 'true', false, 'Welcome code works on the first order only')
on conflict (key) do nothing;

-- ============================================================ tables
create table if not exists public.welcome_tiers (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(trim(label)) > 0),
  discount_type text not null check (discount_type in ('PERCENT', 'FLAT')),
  value numeric(12, 2) not null check (value > 0),
  weight int not null default 100 check (weight between 0 and 100),
  is_active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_type <> 'PERCENT' or value <= 100)
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind text not null default 'general' check (kind in ('general', 'welcome', 'birthday')),
  description text,
  discount_type text not null check (discount_type in ('PERCENT', 'FLAT')),
  value numeric(12, 2) not null check (value > 0),
  max_discount numeric(12, 2) check (max_discount is null or max_discount > 0),
  min_order numeric(12, 2) not null default 0 check (min_order >= 0),
  usage_limit int check (usage_limit is null or usage_limit > 0),
  per_customer_limit int default 1 check (per_customer_limit is null or per_customer_limit > 0),
  first_order_only boolean not null default false,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  is_listed boolean not null default false,
  assigned_user_id uuid references auth.users (id) on delete cascade,
  welcome_tier_id uuid references public.welcome_tiers (id) on delete set null,
  birthday_year int,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_type <> 'PERCENT' or value <= 100),
  check (starts_at is null or expires_at is null or expires_at > starts_at)
);
create index if not exists coupons_assigned_idx on public.coupons (assigned_user_id);
create unique index if not exists coupons_one_welcome_per_customer on public.coupons (assigned_user_id) where kind = 'welcome';
create unique index if not exists coupons_one_birthday_per_year on public.coupons (assigned_user_id, birthday_year) where kind = 'birthday';

create table if not exists public.coupon_categories (
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (coupon_id, category_id)
);
create table if not exists public.coupon_excluded_products (
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  primary key (coupon_id, product_id)
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  order_id uuid not null unique references public.orders (id) on delete cascade,
  discount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  released_at timestamptz
);
create index if not exists coupon_redemptions_coupon_idx on public.coupon_redemptions (coupon_id) where released_at is null;
create index if not exists coupon_redemptions_user_idx on public.coupon_redemptions (user_id, coupon_id) where released_at is null;

-- Codes: uppercase A–Z, 0–9, - and _, 2–40 characters.
create or replace function public.coupons_normalize()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.code := upper(regexp_replace(coalesce(new.code, ''), '\s+', '', 'g'));
  if new.code !~ '^[A-Z0-9_-]{2,40}$' then
    raise exception 'COUPON_CODE_FORMAT: Use 2–40 letters, numbers, - or _ for the code.';
  end if;
  return new;
end $$;
drop trigger if exists coupons_normalize on public.coupons;
create trigger coupons_normalize before insert or update of code on public.coupons for each row execute function public.coupons_normalize();
drop trigger if exists coupons_updated_at on public.coupons;
create trigger coupons_updated_at before update on public.coupons for each row execute function public.set_updated_at();
drop trigger if exists welcome_tiers_updated_at on public.welcome_tiers;
create trigger welcome_tiers_updated_at before update on public.welcome_tiers for each row execute function public.set_updated_at();

alter table public.coupons enable row level security;
alter table public.coupon_categories enable row level security;
alter table public.coupon_excluded_products enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.welcome_tiers enable row level security;

-- No public coupon list: customers see only their own personal codes.
drop policy if exists coupons_own on public.coupons;
create policy coupons_own on public.coupons for select to authenticated using (assigned_user_id = auth.uid() or public.is_admin());
drop policy if exists coupons_admin on public.coupons;
create policy coupons_admin on public.coupons for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists coupon_categories_admin on public.coupon_categories;
create policy coupon_categories_admin on public.coupon_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists coupon_excluded_admin on public.coupon_excluded_products;
create policy coupon_excluded_admin on public.coupon_excluded_products for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists coupon_redemptions_read on public.coupon_redemptions;
create policy coupon_redemptions_read on public.coupon_redemptions for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists welcome_tiers_admin on public.welcome_tiers;
create policy welcome_tiers_admin on public.welcome_tiers for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================ evaluation
create or replace function app_private.ist_date(t timestamptz)
returns text language sql immutable set search_path = '' as $$
  select to_char(t at time zone 'Asia/Kolkata', 'FMDD Mon YYYY')
$$;

create or replace function app_private.rupees(n numeric)
returns text language sql immutable set search_path = '' as $$
  select '₹' || trim(to_char(round(n), 'FM99,99,99,99,990'))
$$;

-- Value of the bag lines this coupon covers (categories include their children; excluded products never count).
create or replace function app_private.coupon_eligible_amount(p_coupon uuid, p_lines jsonb)
returns numeric language sql stable security definer set search_path = '' as $$
  with recursive scope as (
    select category_id as id from public.coupon_categories where coupon_id = p_coupon
    union
    select c.id from public.categories c join scope s on c.parent_id = s.id
  ),
  lines as (
    select (l ->> 'product_id')::uuid as product_id, (l ->> 'line_total')::numeric as amount
    from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) l
  )
  select coalesce(sum(l.amount), 0)
  from lines l join public.products p on p.id = l.product_id
  where not exists (select 1 from public.coupon_excluded_products x where x.coupon_id = p_coupon and x.product_id = l.product_id)
    and (
      not exists (select 1 from public.coupon_categories where coupon_id = p_coupon)
      or p.primary_category_id in (select id from scope)
      or exists (select 1 from public.product_categories pc where pc.product_id = p.id and pc.category_id in (select id from scope))
    )
$$;

create or replace function app_private.evaluate_coupon(p_user uuid, c public.coupons, p_lines jsonb)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  eligible numeric;
  discount numeric;
  used_by_me int;
  used_total int;
  base jsonb := jsonb_build_object('id', c.id, 'code', c.code, 'kind', c.kind, 'description', c.description, 'expires_at', c.expires_at);
  fail jsonb;
begin
  fail := case
    when c.assigned_user_id is not null and c.assigned_user_id is distinct from p_user then
      jsonb_build_object('reason', 'NOT_FOUND', 'message', 'This code isn''t valid.')
    when not c.is_active then jsonb_build_object('reason', 'INACTIVE', 'message', 'This code is no longer active.')
    when c.starts_at is not null and c.starts_at > now() then
      jsonb_build_object('reason', 'NOT_STARTED', 'message', 'This code works from ' || app_private.ist_date(c.starts_at) || '.')
    when c.expires_at is not null and c.expires_at <= now() then
      jsonb_build_object('reason', 'EXPIRED', 'message', 'This code expired on ' || app_private.ist_date(c.expires_at) || '.')
    when p_user is null and (c.per_customer_limit is not null or c.first_order_only or c.assigned_user_id is not null) then
      jsonb_build_object('reason', 'SIGN_IN', 'message', 'Sign in to use this code.')
  end;
  if fail is not null then
    return base || fail || jsonb_build_object('ok', false, 'discount', 0);
  end if;

  if p_user is not null and c.per_customer_limit is not null then
    select count(*) into used_by_me from public.coupon_redemptions where coupon_id = c.id and user_id = p_user and released_at is null;
    if used_by_me >= c.per_customer_limit then
      return base || jsonb_build_object('ok', false, 'reason', 'ALREADY_USED', 'message', 'You''ve already used this code.', 'discount', 0);
    end if;
  end if;
  if c.usage_limit is not null then
    select count(*) into used_total from public.coupon_redemptions where coupon_id = c.id and released_at is null;
    if used_total >= c.usage_limit then
      return base || jsonb_build_object('ok', false, 'reason', 'FULLY_REDEEMED', 'message', 'This code has been fully redeemed.', 'discount', 0);
    end if;
  end if;
  if c.first_order_only and p_user is not null
     and exists (select 1 from public.orders where user_id = p_user and status <> 'CANCELLED') then
    return base || jsonb_build_object('ok', false, 'reason', 'FIRST_ORDER', 'message', 'This code is for your first order only.', 'discount', 0);
  end if;

  eligible := app_private.coupon_eligible_amount(c.id, p_lines);
  if eligible <= 0 then
    return base || jsonb_build_object('ok', false, 'reason', 'NOTHING_ELIGIBLE', 'message', 'This code doesn''t cover the items in your bag.', 'discount', 0, 'eligible', 0);
  end if;
  if c.min_order > 0 and eligible < c.min_order then
    return base || jsonb_build_object('ok', false, 'reason', 'BELOW_MIN',
      'message', 'This code needs ' || app_private.rupees(c.min_order) || ' of eligible items. Add ' || app_private.rupees(c.min_order - eligible) || ' more.',
      'discount', 0, 'eligible', eligible, 'min_order', c.min_order);
  end if;

  discount := case when c.discount_type = 'PERCENT' then round(eligible * c.value / 100) else c.value end;
  if c.max_discount is not null then discount := least(discount, c.max_discount); end if;
  discount := least(discount, eligible);
  return base || jsonb_build_object('ok', true, 'reason', null, 'discount', discount, 'eligible', eligible,
    'message', c.code || ' applied — you save ' || app_private.rupees(discount) || '.');
end $$;

-- Replaces the phase 4 placeholder used by app_private.quote.
create or replace function app_private.coupon_quote(p_user uuid, p_code text, p_subtotal numeric, p_lines jsonb)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  norm text := upper(regexp_replace(coalesce(p_code, ''), '\s+', '', 'g'));
  c public.coupons;
begin
  if norm = '' then
    return null;
  end if;
  select * into c from public.coupons where code = norm;
  if not found then
    return jsonb_build_object('ok', false, 'code', norm, 'reason', 'NOT_FOUND', 'message', 'This code isn''t valid.', 'discount', 0);
  end if;
  return app_private.evaluate_coupon(p_user, c, p_lines);
end $$;

-- The "Apply coupon" sheet: listed general codes + the shopper's personal codes, priced against the bag.
create or replace function public.available_coupons(p_items jsonb)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  lines jsonb := app_private.quote(uid, p_items, null, 'COD', '[]'::jsonb) -> 'lines';
  c public.coupons;
  r jsonb;
  out jsonb := '[]'::jsonb;
begin
  for c in
    select * from public.coupons
    where is_active
      and (expires_at is null or expires_at > now())
      and ((kind = 'general' and is_listed and assigned_user_id is null) or (uid is not null and assigned_user_id = uid))
  loop
    r := app_private.evaluate_coupon(uid, c, lines);
    -- Codes that can never apply are hidden.
    if (r ->> 'reason') in ('NOT_FOUND', 'INACTIVE', 'EXPIRED', 'ALREADY_USED', 'FULLY_REDEEMED', 'FIRST_ORDER') then
      continue;
    end if;
    out := out || jsonb_build_array(r);
  end loop;
  return coalesce((
    select jsonb_agg(e order by (e ->> 'ok')::boolean desc, (e ->> 'discount')::numeric desc, e ->> 'code')
    from jsonb_array_elements(out) e), '[]'::jsonb);
end $$;
grant execute on function public.available_coupons(jsonb) to anon, authenticated;

-- ============================================================ redemption (COD: at order; released on cancel)
create or replace function app_private.orders_coupon_redeem()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c public.coupons; used_total int; used_by_me int;
begin
  if new.coupon_id is null or new.payment_method <> 'COD' then
    return new;
  end if;
  select * into c from public.coupons where id = new.coupon_id for update;
  if c.usage_limit is not null then
    select count(*) into used_total from public.coupon_redemptions where coupon_id = c.id and released_at is null;
    if used_total >= c.usage_limit then
      raise exception 'COUPON_INVALID: % has just been fully redeemed. Remove it to continue.', c.code;
    end if;
  end if;
  if c.per_customer_limit is not null then
    select count(*) into used_by_me from public.coupon_redemptions where coupon_id = c.id and user_id = new.user_id and released_at is null;
    if used_by_me >= c.per_customer_limit then
      raise exception 'COUPON_INVALID: You''ve already used %. Remove it to continue.', c.code;
    end if;
  end if;
  insert into public.coupon_redemptions (coupon_id, user_id, order_id, discount) values (c.id, new.user_id, new.id, new.discount);
  return new;
end $$;
drop trigger if exists orders_coupon_redeem on public.orders;
create trigger orders_coupon_redeem after insert on public.orders for each row execute function app_private.orders_coupon_redeem();

create or replace function app_private.orders_coupon_release()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'CANCELLED' and old.status is distinct from 'CANCELLED' then
    update public.coupon_redemptions set released_at = now() where order_id = new.id and released_at is null;
  end if;
  return new;
end $$;
drop trigger if exists orders_coupon_release on public.orders;
create trigger orders_coupon_release after update of status on public.orders for each row execute function app_private.orders_coupon_release();

-- ============================================================ admin save
create or replace function public.save_coupon(payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  cid uuid := nullif(payload ->> 'id', '')::uuid;
  norm text := upper(regexp_replace(coalesce(payload ->> 'code', ''), '\s+', '', 'g'));
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can change coupons.';
  end if;
  if exists (select 1 from public.coupons where code = norm and id is distinct from cid) then
    raise exception 'COUPON_CODE_TAKEN: The code % is already used by another coupon.', norm;
  end if;
  if cid is null then
    insert into public.coupons (code, discount_type, value) values (norm, payload ->> 'discount_type', (payload ->> 'value')::numeric)
    returning id into cid;
  end if;
  update public.coupons set
    code = norm,
    kind = coalesce(nullif(payload ->> 'kind', ''), kind),
    description = nullif(trim(coalesce(payload ->> 'description', '')), ''),
    discount_type = payload ->> 'discount_type',
    value = (payload ->> 'value')::numeric,
    max_discount = nullif(payload ->> 'max_discount', '')::numeric,
    min_order = coalesce(nullif(payload ->> 'min_order', '')::numeric, 0),
    usage_limit = nullif(payload ->> 'usage_limit', '')::int,
    per_customer_limit = nullif(payload ->> 'per_customer_limit', '')::int,
    first_order_only = coalesce((payload ->> 'first_order_only')::boolean, false),
    starts_at = nullif(payload ->> 'starts_at', '')::timestamptz,
    expires_at = nullif(payload ->> 'expires_at', '')::timestamptz,
    is_active = coalesce((payload ->> 'is_active')::boolean, true),
    is_listed = coalesce((payload ->> 'is_listed')::boolean, false),
    assigned_user_id = nullif(payload ->> 'assigned_user_id', '')::uuid,
    admin_note = nullif(trim(coalesce(payload ->> 'admin_note', '')), '')
  where id = cid;

  delete from public.coupon_categories where coupon_id = cid;
  insert into public.coupon_categories (coupon_id, category_id)
  select cid, x::uuid from jsonb_array_elements_text(coalesce(payload -> 'category_ids', '[]'::jsonb)) x
  on conflict do nothing;
  delete from public.coupon_excluded_products where coupon_id = cid;
  insert into public.coupon_excluded_products (coupon_id, product_id)
  select cid, x::uuid from jsonb_array_elements_text(coalesce(payload -> 'excluded_product_ids', '[]'::jsonb)) x
  on conflict do nothing;
  return cid;
end $$;
grant execute on function public.save_coupon(jsonb) to authenticated;

-- ============================================================ personal codes
create or replace function app_private.random_code(p_prefix text)
returns text language plpgsql volatile set search_path = '' as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
begin
  loop
    candidate := upper(regexp_replace(coalesce(nullif(trim(p_prefix), ''), 'SAU'), '[^A-Za-z0-9_]', '', 'g')) || '-';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.coupons where code = candidate);
  end loop;
  return candidate;
end $$;

-- One welcome code per customer, tier chosen by weight. Never blocks a signup.
create or replace function app_private.issue_welcome_coupon(p_user uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  tier public.welcome_tiers;
  max_cap numeric := app_private.setting_num('welcome.max_discount', 0);
  cid uuid;
begin
  if not app_private.setting_bool('welcome.enabled', false) then
    return null;
  end if;
  if exists (select 1 from public.coupons where assigned_user_id = p_user and kind = 'welcome') then
    return null;
  end if;
  select * into tier from public.welcome_tiers
  where is_active and weight > 0
  order by -ln(1 - random()) / weight
  limit 1;
  if not found then
    return null;
  end if;
  insert into public.coupons (code, kind, description, discount_type, value, max_discount, min_order, usage_limit, per_customer_limit,
    first_order_only, expires_at, is_active, is_listed, assigned_user_id, welcome_tier_id)
  values (app_private.random_code(app_private.setting('welcome.prefix') #>> '{}'), 'welcome', tier.label, tier.discount_type, tier.value,
    case when max_cap > 0 then max_cap end, app_private.setting_num('welcome.min_order', 0), 1, 1,
    app_private.setting_bool('welcome.first_order_only', true),
    now() + make_interval(days => greatest(1, app_private.setting_num('welcome.valid_days', 30)::int)), true, false, p_user, tier.id)
  returning id into cid;
  return cid;
exception when others then
  return null;
end $$;

create or replace function app_private.profiles_welcome()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform app_private.issue_welcome_coupon(new.id);
  return new;
end $$;
drop trigger if exists profiles_welcome on public.profiles;
create trigger profiles_welcome after insert on public.profiles for each row execute function app_private.profiles_welcome();

-- Birthday: customers born on a given day, and releasing one code each for that birthday year.
create or replace function public.birthday_customers(p_month int, p_day int, p_year int default null)
returns table (user_id uuid, full_name text, email text, phone text, date_of_birth date, has_code boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can see this.';
  end if;
  return query
    select p.id, p.full_name, p.email, p.phone, p.date_of_birth,
      exists (select 1 from public.coupons c where c.assigned_user_id = p.id and c.kind = 'birthday'
              and c.birthday_year = coalesce(p_year, extract(year from (now() at time zone 'Asia/Kolkata'))::int))
    from public.profiles p
    where p.date_of_birth is not null
      and extract(month from p.date_of_birth) = p_month and extract(day from p.date_of_birth) = p_day
    order by p.full_name nulls last;
end $$;
grant execute on function public.birthday_customers(int, int, int) to authenticated;

create or replace function public.release_birthday_coupons(p_month int, p_day int, p_year int, payload jsonb)
returns int language plpgsql security definer set search_path = '' as $$
declare
  r record;
  n int := 0;
  valid_days int := greatest(1, coalesce(nullif(payload ->> 'valid_days', '')::int, 14));
  starts timestamptz := (make_date(p_year, p_month, p_day)::timestamp at time zone 'Asia/Kolkata') - interval '7 days';
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can release birthday codes.';
  end if;
  if (payload ->> 'discount_type') not in ('PERCENT', 'FLAT') or coalesce(nullif(payload ->> 'value', '')::numeric, 0) <= 0 then
    raise exception 'COUPON_VALUE: Choose percent or flat, and a value above 0.';
  end if;
  for r in select * from public.birthday_customers(p_month, p_day, p_year) where not has_code loop
    insert into public.coupons (code, kind, description, discount_type, value, max_discount, min_order, usage_limit, per_customer_limit,
      starts_at, expires_at, is_active, is_listed, assigned_user_id, birthday_year)
    values (app_private.random_code(coalesce(nullif(payload ->> 'prefix', ''), 'BDAY')), 'birthday',
      nullif(trim(coalesce(payload ->> 'description', '')), ''),
      payload ->> 'discount_type', (payload ->> 'value')::numeric, nullif(payload ->> 'max_discount', '')::numeric,
      coalesce(nullif(payload ->> 'min_order', '')::numeric, 0), 1, 1,
      greatest(now(), starts), greatest(now(), starts) + make_interval(days => valid_days + 7), true, false, r.user_id, p_year);
    n := n + 1;
  end loop;
  return n;
end $$;
grant execute on function public.release_birthday_coupons(int, int, int, jsonb) to authenticated;

-- ============================================================ seed
insert into public.welcome_tiers (label, discount_type, value, weight, position)
select '10% off your first order', 'PERCENT', 10, 100, 0
where not exists (select 1 from public.welcome_tiers);

insert into public.coupons (code, kind, description, discount_type, value, min_order, usage_limit, per_customer_limit, is_active, is_listed, admin_note)
values ('SAMPLE10', 'general', 'Sample coupon: 10% off', 'PERCENT', 10, 0, null, 1, false, true,
        'SAMPLE coupon created with the store. Edit or delete it before launch.')
on conflict (code) do nothing;
