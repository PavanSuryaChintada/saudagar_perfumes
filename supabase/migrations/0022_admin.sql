-- 0022_admin: dashboard figures, the customers list, birthday correction, and the admin notifications bell.

-- ============================================================ dashboard
create or replace function public.admin_dashboard(p_days int default 30)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  days int := least(366, greatest(1, coalesce(p_days, 30)));
  since timestamptz := date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata' - make_interval(days => days - 1);
  low int := app_private.setting_num('inventory.low_stock_threshold', 5)::int;
  warnings jsonb := '[]'::jsonb;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can see this.';
  end if;

  if not app_private.setting_bool('cod.enabled', false) and not app_private.setting_bool('payments.online_enabled', false) then
    warnings := warnings || jsonb_build_object('level', 'critical', 'text', 'Checkout is paused: cash on delivery and online payment are both off.', 'link', '/admin/settings');
  end if;
  if app_private.setting_bool('samples.enabled', false) and not exists (
    select 1 from public.product_variants v join public.products p on p.id = v.product_id
    where v.kind = 'sample' and v.in_sample_pool and v.is_active and not v.is_hidden and v.stock > 0 and p.is_active and p.archived_at is null) then
    warnings := warnings || jsonb_build_object('level', 'warning', 'text', 'The free sample list is empty, so orders go out without samples.', 'link', '/admin/samples');
  end if;
  if coalesce(app_private.setting('business.gstin') #>> '{}', '') = '' then
    warnings := warnings || jsonb_build_object('level', 'warning', 'text', 'Add your GSTIN and business address before printing invoices.', 'link', '/admin/settings');
  end if;
  if exists (select 1 from public.orders where status = 'PACKED' and shipping_error is not null) then
    warnings := warnings || jsonb_build_object('level', 'serious', 'text', 'A courier booking failed. Open the order and retry.', 'link', '/admin/orders?status=PACKED');
  end if;

  return jsonb_build_object(
    'days', days,
    'kpis', (
      select jsonb_build_object(
        'revenue', coalesce(sum(total), 0),
        'orders', count(*),
        'aov', case when count(*) > 0 then round(sum(total) / count(*)) else 0 end
      )
      from public.orders where created_at >= since and status <> 'CANCELLED' and replacement_for is null
    ) || jsonb_build_object(
      'pending', (select count(*) from public.orders where status = 'PENDING'),
      'to_ship', (select count(*) from public.orders where status = 'PACKED'),
      'customers', (select count(*) from public.profiles p where not exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'admin')),
      'new_customers', (select count(*) from public.profiles p where p.created_at >= since and not exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'admin')),
      'low_stock', (select count(*) from public.product_variants v join public.products p on p.id = v.product_id
                    where v.is_active and not v.is_hidden and p.archived_at is null and v.stock <= low),
      'returns_waiting', (select count(*) from public.returns where status = 'REQUESTED'),
      'reviews_waiting', (select count(*) from public.reviews where status = 'PENDING')
    ),
    'series', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'revenue', coalesce(x.revenue, 0), 'orders', coalesce(x.orders, 0)) order by d), '[]'::jsonb)
      from generate_series((since at time zone 'Asia/Kolkata')::date, (now() at time zone 'Asia/Kolkata')::date, interval '1 day') d
      left join (
        select (created_at at time zone 'Asia/Kolkata')::date as day, sum(total) as revenue, count(*) as orders
        from public.orders where created_at >= since and status <> 'CANCELLED' and replacement_for is null group by 1
      ) x on x.day = d::date
    ),
    'cities', (
      select coalesce(jsonb_agg(jsonb_build_object('label', ship_city, 'orders', n, 'revenue', rev) order by rev desc), '[]'::jsonb)
      from (select initcap(trim(ship_city)) as ship_city, count(*) n, sum(total) rev from public.orders
            where created_at >= since and status <> 'CANCELLED' and replacement_for is null and ship_city is not null group by 1 order by 3 desc limit 10) c
    ),
    'states', (
      select coalesce(jsonb_agg(jsonb_build_object('label', ship_state, 'orders', n, 'revenue', rev) order by rev desc), '[]'::jsonb)
      from (select ship_state, count(*) n, sum(total) rev from public.orders
            where created_at >= since and status <> 'CANCELLED' and replacement_for is null group by 1 order by 3 desc limit 8) s
    ),
    'products', (
      select coalesce(jsonb_agg(jsonb_build_object('label', name, 'units', units, 'revenue', rev, 'id', product_id) order by rev desc), '[]'::jsonb)
      from (select i.product_id, max(i.product_name) as name, sum(i.qty) units, sum(i.line_total) rev
            from public.order_items i join public.orders o on o.id = i.order_id
            where o.created_at >= since and o.status <> 'CANCELLED' and i.line_type = 'item' group by 1 order by 4 desc limit 10) p
    ),
    'notes', (
      select coalesce(jsonb_agg(jsonb_build_object('label', name, 'revenue', rev) order by rev desc), '[]'::jsonb)
      from (select n.name, sum(i.line_total) rev
            from public.order_items i join public.orders o on o.id = i.order_id
            join public.product_notes pn on pn.product_id = i.product_id join public.notes n on n.id = pn.note_id
            where o.created_at >= since and o.status <> 'CANCELLED' and i.line_type = 'item' group by 1 order by 2 desc limit 10) t
    ),
    'warnings', warnings
  );
end $$;
grant execute on function public.admin_dashboard(int) to authenticated;

-- ============================================================ customers
create or replace function public.admin_customers(p_search text default null, p_page int default 0, p_page_size int default 50)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare term text := nullif(trim(coalesce(p_search, '')), ''); size int := least(200, greatest(1, p_page_size));
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can see customers.';
  end if;
  return (
    with base as (
      select p.id, p.full_name, p.email, p.phone, p.date_of_birth, p.created_at, p.marketing_opt_in,
        (select count(*) from public.orders o where o.user_id = p.id and o.status <> 'CANCELLED') as orders,
        (select coalesce(sum(total), 0) from public.orders o where o.user_id = p.id and o.status <> 'CANCELLED') as spent,
        (select max(created_at) from public.orders o where o.user_id = p.id) as last_order_at
      from public.profiles p
      where not exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'admin')
        and (term is null or p.full_name ilike '%' || term || '%' or p.email ilike '%' || term || '%' or p.phone ilike '%' || term || '%')
    )
    select jsonb_build_object(
      'count', (select count(*) from base),
      'rows', coalesce((select jsonb_agg(to_jsonb(b) order by b.created_at desc) from (select * from base order by created_at desc offset greatest(0, p_page) * size limit size) b), '[]'::jsonb))
  );
end $$;
grant execute on function public.admin_customers(text, int, int) to authenticated;

create or replace function public.set_customer_birthday(p_user uuid, p_date date)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN: Only admins can correct birthdays.';
  end if;
  if p_date is not null and (p_date > current_date or p_date < date '1900-01-01') then
    raise exception 'DOB_INVALID: Enter a real date of birth.';
  end if;
  update public.profiles set date_of_birth = p_date, dob_locked = p_date is not null where id = p_user;
end $$;
grant execute on function public.set_customer_birthday(uuid, date) to authenticated;

-- ============================================================ notifications bell
create table if not exists public.admin_notifications (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('order', 'shipping', 'return', 'low_stock', 'review', 'back_in_stock')),
  title text not null,
  body text,
  link text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists admin_notifications_unread_idx on public.admin_notifications (created_at desc) where read_at is null;
alter table public.admin_notifications enable row level security;
drop policy if exists admin_notifications_admin on public.admin_notifications;
create policy admin_notifications_admin on public.admin_notifications for all to authenticated using (public.is_admin()) with check (public.is_admin());

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_notifications') then
    alter publication supabase_realtime add table public.admin_notifications;
  end if;
end $$;

create or replace function app_private.notify_admin(p_kind text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = '' as $$
  insert into public.admin_notifications (kind, title, body, link) values (p_kind, p_title, p_body, p_link)
$$;

create or replace function app_private.notify_orders()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.replacement_for is null then
    perform app_private.notify_admin('order', 'New order ' || new.order_number,
      coalesce(new.customer_name, 'Customer') || ' · ' || app_private.rupees(new.total) || ' · ' ||
      case when new.payment_method = 'COD' then 'cash on delivery' else 'online' end, '/admin/orders/' || new.id);
  elsif tg_op = 'UPDATE' and new.shipping_error is not null and new.shipping_error is distinct from old.shipping_error then
    perform app_private.notify_admin('shipping', 'Courier booking failed · ' || new.order_number, left(new.shipping_error, 200), '/admin/orders/' || new.id);
  elsif tg_op = 'UPDATE' and new.payment_method = 'ONLINE' and new.payment_status = 'PAID' and old.payment_status <> 'PAID' then
    perform app_private.notify_admin('order', 'Paid online · ' || new.order_number, app_private.rupees(new.total), '/admin/orders/' || new.id);
  end if;
  return new;
end $$;
drop trigger if exists notify_orders on public.orders;
create trigger notify_orders after insert or update on public.orders for each row execute function app_private.notify_orders();

create or replace function app_private.notify_returns()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform app_private.notify_admin('return', 'Return requested · ' || (select order_number from public.orders where id = new.order_id),
    replace(initcap(new.reason), '_', ' '), '/admin/returns');
  return new;
end $$;
drop trigger if exists notify_returns on public.returns;
create trigger notify_returns after insert on public.returns for each row execute function app_private.notify_returns();

create or replace function app_private.notify_reviews()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform app_private.notify_admin('review', 'Review waiting · ' || (select name from public.products where id = new.product_id),
    new.rating || '★ by ' || new.display_name, '/admin/reviews');
  return new;
end $$;
drop trigger if exists notify_reviews on public.reviews;
create trigger notify_reviews after insert on public.reviews for each row execute function app_private.notify_reviews();

create or replace function app_private.notify_low_stock()
returns trigger language plpgsql security definer set search_path = '' as $$
declare low int := app_private.setting_num('inventory.low_stock_threshold', 5)::int; name text;
begin
  if new.stock <= low and old.stock > low and new.is_active and not new.is_hidden then
    select p.name into name from public.products p where p.id = new.product_id;
    perform app_private.notify_admin('low_stock', case when new.stock = 0 then 'Sold out · ' else 'Low stock · ' end || name || ' ' || new.label,
      new.stock || ' left', '/admin/inventory');
  end if;
  if old.stock = 0 and new.stock > 0 and exists (select 1 from public.back_in_stock_requests where variant_id = new.id and notified_at is null) then
    select p.name into name from public.products p where p.id = new.product_id;
    perform app_private.notify_admin('back_in_stock', 'Back in stock · ' || name || ' ' || new.label,
      (select count(*) from public.back_in_stock_requests where variant_id = new.id and notified_at is null) || ' customer(s) waiting', '/admin/back-in-stock');
  end if;
  return new;
end $$;
drop trigger if exists notify_low_stock on public.product_variants;
create trigger notify_low_stock after update of stock on public.product_variants for each row execute function app_private.notify_low_stock();
