-- Catalog: save_product, derived fields, stable variant ids, sold-variant protection, stock path, notes, RLS.

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000000c1', 'cat-admin@test.local', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c2', 'cat-cust@test.local', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000c1', 'admin');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);

-- create
do $$
declare pid uuid; v50 uuid; v100 uuid;
begin
  pid := public.save_product('{
    "slug": "test-oud", "name": "Test Oud", "base_price": 5000, "is_active": true,
    "variants": [
      {"sku": "TST-OUD-50", "kind": "retail", "size_ml": 50, "label": "50 ml", "price": 4200, "initial_stock": 10},
      {"sku": "TST-OUD-100", "kind": "retail", "size_ml": 100, "label": "100 ml", "initial_stock": 10}
    ],
    "media": [{"kind": "image", "url": "https://x/a.webp", "variant_sku": "TST-OUD-100"}]
  }'::jsonb);
  assert (select total_stock from public.products where id = pid) = 20, 'total_stock derived from variants';
  assert (select min_price from public.products where id = pid) = 4200, 'min_price uses the variant override';
  assert (select max_price from public.products where id = pid) = 5000, 'max_price falls back to base price';
  assert (select available_sizes from public.products where id = pid) = array[50, 100]::numeric[], 'available sizes derived';
  assert (select count(*) from public.inventory_movements m join public.product_variants v on v.id = m.variant_id where v.product_id = pid) = 2,
    'initial stock logged as movements';
  select id into v100 from public.product_variants where sku = 'TST-OUD-100';
  assert (select variant_id from public.product_media where product_id = pid) = v100, 'media attached to variant by sku';
  perform set_config('test.pid', pid::text, true);
end $$;

-- re-save keeps variant ids; removing a sold variant hides it instead of deleting
do $$
declare pid uuid := current_setting('test.pid')::uuid; v50 uuid; v100 uuid; v50_after uuid;
begin
  select id into v50 from public.product_variants where sku = 'TST-OUD-50';
  select id into v100 from public.product_variants where sku = 'TST-OUD-100';
  perform set_config('app.derived_write', 'on', true); -- simulate the order path recording a sale
  update public.product_variants set units_sold = 1 where id = v100;
  perform set_config('app.derived_write', 'off', true);
  perform public.save_product(jsonb_build_object(
    'id', pid, 'slug', 'test-oud', 'name', 'Test Oud Renamed', 'base_price', 5200, 'is_active', true,
    'variants', jsonb_build_array(jsonb_build_object('id', v50, 'sku', 'TST-OUD-50', 'kind', 'retail', 'size_ml', 50, 'label', '50 ml'))
  ));
  select id into v50_after from public.product_variants where sku = 'TST-OUD-50';
  assert v50_after = v50, 'variant id is stable across saves';
  assert (select stock from public.product_variants where id = v50) = 10, 'existing stock untouched by save';
  assert exists (select 1 from public.product_variants where id = v100), 'sold variant is not deleted';
  assert (select is_hidden and stock = 0 from public.product_variants where id = v100), 'sold variant hidden with stock 0';
  assert (select total_stock from public.products where id = pid) = 10, 'hidden variant leaves total stock';
  assert (select name from public.products where id = pid) = 'Test Oud Renamed', 'product fields updated';
end $$;

-- stock path
do $$
declare v50 uuid;
begin
  select id into v50 from public.product_variants where sku = 'TST-OUD-50';
  begin
    update public.product_variants set stock = 99 where id = v50;
    raise exception 'TEST_FAIL: direct stock write allowed';
  exception when others then
    if sqlerrm not like 'STOCK_DIRECT_WRITE%' then raise exception 'expected STOCK_DIRECT_WRITE, got %', sqlerrm; end if;
  end;
  begin
    perform public.adjust_stock(v50, -15, 'damaged', null);
    raise exception 'TEST_FAIL: negative stock allowed';
  exception when others then
    if sqlerrm not like 'STOCK_NEGATIVE%' then raise exception 'expected STOCK_NEGATIVE, got %', sqlerrm; end if;
  end;
  assert public.adjust_stock(v50, 5, 'restock', 'new batch') = 15, 'adjust_stock returns the new stock';
  assert (select stock_after from public.inventory_movements where variant_id = v50 order by created_at desc, id desc limit 1) = 15,
    'movement records stock after';
  assert (select reason from public.inventory_movements where variant_id = v50 order by created_at desc, id desc limit 1) = 'restock',
    'movement records reason';
  begin
    perform public.adjust_stock(v50, 1, 'made-up-reason', null);
    raise exception 'TEST_FAIL: unknown reason allowed';
  exception when others then
    if sqlerrm not like 'STOCK_REASON%' then raise exception 'expected STOCK_REASON, got %', sqlerrm; end if;
  end;
end $$;

-- delete rules
do $$
declare pid uuid := current_setting('test.pid')::uuid; pid2 uuid;
begin
  perform set_config('app.derived_write', 'on', true);
  update public.products set units_sold = 1 where id = pid;
  perform set_config('app.derived_write', 'off', true);
  begin
    perform public.delete_product(pid);
    raise exception 'TEST_FAIL: sold product deleted';
  exception when others then
    if sqlerrm not like 'PRODUCT_SOLD%' then raise exception 'expected PRODUCT_SOLD, got %', sqlerrm; end if;
  end;
  perform public.archive_product(pid);
  assert (select archived_at is not null and not is_active from public.products where id = pid), 'archive sets archived_at and inactive';
  pid2 := public.save_product('{"slug":"never-sold","name":"Never Sold","base_price":100,"variants":[{"sku":"NS-1","kind":"retail","size_ml":10,"label":"10 ml"}]}'::jsonb);
  perform public.delete_product(pid2);
  assert not exists (select 1 from public.products where id = pid2), 'unsold product can be deleted';
end $$;

-- notes: case-insensitive unique names; family must be a note_family option
do $$
declare fam uuid; acc uuid;
begin
  insert into public.attribute_options (kind, label, slug) values ('note_family', 'Woods', 'woods') returning id into fam;
  insert into public.attribute_options (kind, label, slug) values ('accord', 'Smoky', 'smoky') returning id into acc;
  insert into public.notes (name, slug, family_option_id) values ('Oud', 'oud', fam);
  begin
    insert into public.notes (name, slug) values ('oud', 'oud-2');
    raise exception 'TEST_FAIL: duplicate note name allowed';
  exception when unique_violation then null;
  end;
  begin
    insert into public.notes (name, slug, family_option_id) values ('Vetiver', 'vetiver', acc);
    raise exception 'TEST_FAIL: accord used as note family';
  exception when others then
    if sqlerrm not like 'NOTE_FAMILY%' then raise exception 'expected NOTE_FAMILY, got %', sqlerrm; end if;
  end;
end $$;

-- category tree cannot loop
do $$
declare a uuid; b uuid;
begin
  insert into public.categories (slug, name) values ('cat-a', 'A') returning id into a;
  insert into public.categories (slug, name, parent_id) values ('cat-b', 'B', a) returning id into b;
  begin
    update public.categories set parent_id = b where id = a;
    raise exception 'TEST_FAIL: category loop allowed';
  exception when others then
    if sqlerrm not like 'CATEGORY_LOOP%' then raise exception 'expected CATEGORY_LOOP, got %', sqlerrm; end if;
  end;
end $$;

-- search vector picks up note names
do $$
declare pid uuid; nid uuid;
begin
  select id into nid from public.notes where slug = 'oud';
  pid := public.save_product(jsonb_build_object('slug','smoke-test','name','Smoke Test','base_price',100,'is_active',true,
    'variants', jsonb_build_array(jsonb_build_object('sku','SMK-10','kind','retail','size_ml',10,'label','10 ml')),
    'notes', jsonb_build_array(jsonb_build_object('note_id', nid, 'tier', 'base'))));
  assert (select search_vector @@ to_tsquery('simple', 'oud') from public.products where id = pid), 'note names are searchable';
end $$;

-- ===== customer =====
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
do $$ begin
  assert not exists (select 1 from public.products where slug = 'test-oud'), 'archived product hidden from customers';
  assert exists (select 1 from public.products where slug = 'smoke-test'), 'active product visible';
  assert not exists (select 1 from public.product_variants where is_hidden), 'hidden variants not visible';
  begin
    perform public.save_product('{"slug":"hack","name":"Hack","base_price":1}'::jsonb);
    raise exception 'TEST_FAIL: customer saved a product';
  exception when others then
    if sqlerrm not like 'NOT_ADMIN%' then raise exception 'expected NOT_ADMIN, got %', sqlerrm; end if;
  end;
  begin
    insert into public.notes (name, slug) values ('Hack', 'hack');
    raise exception 'TEST_FAIL: customer inserted a note';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
