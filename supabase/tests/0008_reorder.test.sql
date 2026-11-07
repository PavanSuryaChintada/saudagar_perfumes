-- reorder_rows: admin-only, whitelisted tables, positions follow the given order; collection product order.
insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000000e1', 'reorder-admin@test.local', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000e2', 'reorder-cust@test.local', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000e1', 'admin');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
do $$
declare a uuid; b uuid; c uuid; col uuid; p1 uuid; p2 uuid;
begin
  insert into public.attribute_options (kind, label, slug, position) values ('season', 'Tst A', 'tst-a', 0) returning id into a;
  insert into public.attribute_options (kind, label, slug, position) values ('season', 'Tst B', 'tst-b', 1) returning id into b;
  insert into public.attribute_options (kind, label, slug, position) values ('season', 'Tst C', 'tst-c', 2) returning id into c;
  perform public.reorder_rows('attribute_options', array[c, a, b]);
  assert (select position from public.attribute_options where id = c) = 0, 'first id gets position 0';
  assert (select position from public.attribute_options where id = b) = 2, 'last id gets position 2';
  begin
    perform public.reorder_rows('user_roles', array[a]);
    raise exception 'TEST_FAIL: non-whitelisted table reordered';
  exception when others then
    if sqlerrm not like 'REORDER_TABLE%' then raise exception 'expected REORDER_TABLE, got %', sqlerrm; end if;
  end;

  insert into public.collections (slug, name) values ('tst-order', 'Tst Order') returning id into col;
  p1 := public.save_product(jsonb_build_object('slug','tst-o1','name','O1','base_price',1,'collection_ids', jsonb_build_array(col)));
  p2 := public.save_product(jsonb_build_object('slug','tst-o2','name','O2','base_price',1,'collection_ids', jsonb_build_array(col)));
  perform public.reorder_collection_products(col, array[p2, p1]);
  assert (select position from public.product_collections where collection_id = col and product_id = p2) = 0, 'collection order saved';
  perform set_config('test.opt', a::text, true);
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e2","role":"authenticated"}', true);
do $$ begin
  begin
    perform public.reorder_rows('attribute_options', array[current_setting('test.opt')::uuid]);
    raise exception 'TEST_FAIL: customer reordered';
  exception when others then
    if sqlerrm not like 'NOT_ADMIN%' then raise exception 'expected NOT_ADMIN, got %', sqlerrm; end if;
  end;
end $$;
reset role;
