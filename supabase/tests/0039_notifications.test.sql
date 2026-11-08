-- Deleting an order or a product removes its notifications.
do $$
declare oid uuid; pid uuid := gen_random_uuid();
begin
  insert into public.admin_notifications (kind, title, link) values ('order', 'New order TEST-39', '/admin/orders/00000000-0000-0000-0000-000000003901');
  insert into public.admin_notifications (kind, title, link) values ('low_stock', 'Low stock · Tidy Test Oud', '/admin/inventory');
  perform set_config('app.stock_write', 'on', true);
  insert into public.products (id, slug, name, base_price, stock_unit) values (pid, 'tst-tidy-oud', 'Tidy Test Oud', 100, 'piece');
  perform set_config('app.stock_write', 'off', true);
  delete from public.products where id = pid;
  assert not exists (select 1 from public.admin_notifications where title = 'Low stock · Tidy Test Oud'), 'product notifications go with the product';
end $$;
