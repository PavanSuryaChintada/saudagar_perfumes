-- 0039_tidy_notifications: notifications about an order or a product disappear when it is deleted (test orders,
-- removed products), so the bell only counts things that still exist. Clears the ones left behind so far.

create or replace function app_private.orders_drop_notifications()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.admin_notifications where link = '/admin/orders/' || old.id;
  return old;
end $$;
drop trigger if exists orders_drop_notifications on public.orders;
create trigger orders_drop_notifications after delete on public.orders
  for each row execute function app_private.orders_drop_notifications();

create or replace function app_private.products_drop_notifications()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.admin_notifications
  where kind in ('low_stock', 'back_in_stock') and (title like '% · ' || old.name || '%' or link like '%' || old.id::text || '%');
  return old;
end $$;
drop trigger if exists products_drop_notifications on public.products;
create trigger products_drop_notifications after delete on public.products
  for each row execute function app_private.products_drop_notifications();

delete from public.admin_notifications n
where (n.link like '/admin/orders/%' and not exists (select 1 from public.orders o where '/admin/orders/' || o.id = n.link))
   or (n.kind = 'low_stock' and n.title like 'Low stock · E2E %');
