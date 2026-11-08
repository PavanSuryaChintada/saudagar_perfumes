-- Gift pack: priced from each perfume's base size less the pack discount, every pick takes its ml through the stock
-- path, the pack box isn't counted, one free pack sample (never one of the picks), the pack's ml doesn't earn normal
-- samples, cancelling gives the liquid back, and the shop refuses broken packs.

update public.settings set value = 'true' where key in ('cod.enabled', 'giftpack.enabled', 'samples.enabled');
update public.settings set value = '0' where key in ('shipping.free_threshold', 'cod.max_order', 'cod.max_open_orders');
update public.settings set value = 'false' where key = 'welcome.enabled';
update public.settings set value = '5' where key = 'giftpack.count';
update public.settings set value = '20' where key = 'giftpack.size_ml';
update public.settings set value = '30' where key = 'giftpack.price_base_ml';
update public.settings set value = '66.67' where key = 'giftpack.price_percent';
update public.settings set value = '10' where key = 'giftpack.discount_percent';
update public.settings set value = '10' where key = 'giftpack.sample_ml';
update public.settings set value = '50' where key = 'samples.ml_per_sample';
update public.settings set value = '3' where key = 'samples.max_per_order';

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000033a1', 'pack-admin@test.local', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000033c1', 'pack-cust@test.local', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000033a1', 'admin');
insert into public.addresses (id, user_id, full_name, phone, line1, city, state, pincode) values
  ('00000000-0000-0000-0000-00000033ad01', '00000000-0000-0000-0000-0000000033c1', 'Pack Buyer', '9800033001', '1 Gift Lane', 'Guntur', 'Andhra Pradesh', '522001');

-- Only these test perfumes are in the sample pool, so the pack sample is predictable.
update public.product_variants set in_sample_pool = false where kind = 'sample';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000033a1","role":"authenticated"}', true);
create temp table t_gp (k text primary key, id uuid) on commit drop;
grant all on t_gp to public;
do $$
declare a uuid; b uuid; c uuid; nb uuid;
begin
  a := public.save_product(jsonb_build_object('slug', 'tst-pack-amber', 'name', 'Pack Amber', 'base_price', 1500, 'is_active', true,
    'primary_category_id', (select id from public.categories order by created_at limit 1),
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-PA-30', 'kind', 'retail', 'size_ml', 30, 'label', '30 ml'),
                                  jsonb_build_object('sku', 'TST-PA-100', 'kind', 'retail', 'size_ml', 100, 'label', '100 ml', 'price', 4000))));
  b := public.save_product(jsonb_build_object('slug', 'tst-pack-musk', 'name', 'Pack Musk', 'base_price', 900, 'is_active', true,
    'primary_category_id', (select id from public.categories order by created_at limit 1),
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-PM-30', 'kind', 'retail', 'size_ml', 30, 'label', '30 ml'))));
  -- Sold only in 50 ml: can't go in a pack.
  nb := public.save_product(jsonb_build_object('slug', 'tst-pack-no30', 'name', 'Pack No Thirty', 'base_price', 2000, 'is_active', true,
    'primary_category_id', (select id from public.categories order by created_at limit 1),
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-PN-50', 'kind', 'retail', 'size_ml', 50, 'label', '50 ml'))));
  -- The only perfume in the sample pool: it becomes the pack sample.
  c := public.save_product(jsonb_build_object('slug', 'tst-pack-vial', 'name', 'Pack Vial', 'base_price', 1000, 'is_active', true,
    'primary_category_id', (select id from public.categories order by created_at limit 1),
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-PV-30', 'kind', 'retail', 'size_ml', 30, 'label', '30 ml'))));
  perform public.create_sample_variant(c, 5, 0);
  perform public.adjust_liquid(a, 'set', 200, 'ml', null, null);
  perform public.adjust_liquid(b, 'set', 1000, 'ml', null, null);
  perform public.adjust_liquid(nb, 'set', 1000, 'ml', null, null);
  perform public.adjust_liquid(c, 'set', 1000, 'ml', null, null);
  insert into t_gp values ('a', a), ('b', b), ('c', c), ('nb', nb);
  insert into t_gp select 'box', v.id from public.product_variants v join public.products p on p.id = v.product_id where p.is_gift_pack limit 1;
end $$;

do $$
declare o jsonb; a uuid := (select id from t_gp where k = 'a'); nb uuid := (select id from t_gp where k = 'nb');
begin
  o := public.gift_pack_options();
  assert (o ->> 'enabled')::boolean, 'the pack is on';
  assert (o ->> 'count')::int = 5, 'five perfumes';
  assert exists (select 1 from jsonb_array_elements(o -> 'perfumes') x where (x ->> 'product_id')::uuid = a and (x ->> 'price')::numeric = 1000 and (x ->> 'max_picks')::int = 10),
    'Pack Amber: 66.67% of ₹1500 = ₹1000 each, and 200 ml left is enough for 10 picks of 20 ml';
  assert not exists (select 1 from jsonb_array_elements(o -> 'perfumes') x where (x ->> 'product_id')::uuid = nb), 'perfumes without a 30 ml size are left out';
end $$;

-- A customer builds a pack: Amber three times, Musk twice. (1000 × 3 + 600 × 2) less 10% = 3780.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000033c1","role":"authenticated"}', true);
do $$
declare q jsonb; a uuid := (select id from t_gp where k = 'a'); b uuid := (select id from t_gp where k = 'b'); nb uuid := (select id from t_gp where k = 'nb');
  pack jsonb;
begin
  pack := jsonb_build_object('key', 'pk1', 'picks', jsonb_build_array(a, a, a, b, b));
  q := public.quote_order(jsonb_build_array(pack));
  assert jsonb_array_length(q -> 'problems') = 0, 'a good pack has no problems: ' || (q -> 'problems')::text;
  assert (q -> 'lines' -> 0 ->> 'kind') = 'gift_pack' and (q -> 'lines' -> 0 ->> 'key') = 'pk1', 'the pack line keeps its key';
  assert (q -> 'lines' -> 0 ->> 'unit_price')::numeric = 3780, 'priced at 3780, got ' || (q -> 'lines' -> 0 ->> 'unit_price');
  assert (q -> 'lines' -> 0 ->> 'compare_at_price')::numeric = 4200, 'shows the 4200 before the pack discount';
  assert jsonb_array_length(q -> 'lines' -> 0 -> 'picks') = 5, 'all five perfumes listed';
  assert (q -> 'samples' ->> 'entitlement')::int = 0, 'the pack''s 100 ml doesn''t earn normal samples';

  -- Four picks, a perfume without a 30 ml size, and more ml than is left are all refused.
  q := public.quote_order(jsonb_build_array(jsonb_build_object('key', 'x', 'picks', jsonb_build_array(a, a, a, b))));
  assert (q -> 'problems' -> 0 ->> 'message') like 'Choose 5 perfumes%', 'four picks refused';
  q := public.quote_order(jsonb_build_array(jsonb_build_object('key', 'x', 'picks', jsonb_build_array(a, a, a, b, nb))));
  assert (q -> 'problems' -> 0 ->> 'key') = 'x' and jsonb_array_length(q -> 'lines') = 0, 'a perfume without 30 ml refused';
  q := public.quote_order(jsonb_build_array(pack, jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'TST-PA-100'), 'qty', 2)));
  assert (q -> 'problems' -> 0 ->> 'message') like 'Only 200 ml of Pack Amber is left%', 'pack ml and bottles share the liquid';
  -- The pack box can't be bought on its own.
  q := public.quote_order(jsonb_build_array(jsonb_build_object('variant_id', (select id from t_gp where k = 'box'), 'qty', 1)));
  assert (q -> 'problems' -> 0 ->> 'reason') = 'UNAVAILABLE', 'the box alone is refused';
end $$;

create temp table t_ord on commit drop as
  select (public.create_order('00000000-0000-0000-0000-00000033ad01',
    jsonb_build_array(jsonb_build_object('key', 'pk1', 'picks', jsonb_build_array(
      (select id from t_gp where k = 'a'), (select id from t_gp where k = 'a'), (select id from t_gp where k = 'a'),
      (select id from t_gp where k = 'b'), (select id from t_gp where k = 'b')))), null, 'COD') ->> 'id')::uuid as id;
grant select on t_ord to public;
reset role;
do $$
declare oid uuid := (select id from t_ord); a uuid := (select id from t_gp where k = 'a'); b uuid := (select id from t_gp where k = 'b');
  c uuid := (select id from t_gp where k = 'c'); pack_line uuid;
begin
  select id into pack_line from public.order_items where order_id = oid and line_type = 'item';
  assert (select total from public.orders where id = oid) = 3780, 'the order total is the pack price';
  assert (select count(*) from public.order_items where order_id = oid and line_type = 'pack_item' and parent_item_id = pack_line) = 2, 'two perfumes listed under the pack';
  assert (select qty from public.order_items where order_id = oid and line_type = 'pack_item' and product_id = a) = 3, 'Amber three times';
  assert (select stock_ml from public.products where id = a) = 140, '3 × 20 ml of Amber poured';
  assert (select stock_ml from public.products where id = b) = 960, '2 × 20 ml of Musk poured';
  assert (select count(*) from public.order_items where order_id = oid and line_type = 'sample' and parent_item_id = pack_line and product_id = c) = 1,
    'one free pack sample, from a perfume that isn''t in the pack';
  assert (select stock_ml from public.products where id = c) = 990, 'the pack sample took 10 ml';
  assert not exists (select 1 from public.product_variants where purpose is not null and not is_hidden), 'helper sizes stay hidden';
  assert (select available_sizes from public.products where id = a) = '{30,100}', 'the 20 ml pour never shows as a size';

  perform app_private.cancel_order_internal(oid, 'admin', 'test');
  assert (select stock_ml from public.products where id = a) = 200, 'cancelling gave Amber back';
  assert (select stock_ml from public.products where id = c) = 1000, 'and the pack sample';

  -- Pretend the 100 ml size has sold before, so removing it retires it instead of deleting it.
  perform set_config('app.derived_write', 'on', true);
  update public.product_variants set units_sold = 1 where sku = 'TST-PA-100';
  perform set_config('app.derived_write', 'off', true);
end $$;

-- Suggested samples: real picks from the sample pool, avoiding the bag.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000033c1","role":"authenticated"}', true);
do $$
declare s jsonb;
begin
  s := public.suggest_samples(2, array[(select id from t_gp where k = 'a')]);
  assert jsonb_array_length(s) = 2, 'two suggestions (duplicates allowed when the pool is small)';
  assert (select v.product_id from public.product_variants v where v.id = (s ->> 0)::uuid) = (select id from t_gp where k = 'c'), 'from the sample pool';
  assert jsonb_array_length(public.suggest_samples(0, '{}')) = 0, 'none asked, none given';
end $$;

-- Saving a perfume never touches its gift pack pours.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000033a1","role":"authenticated"}', true);
do $$
declare a uuid := (select id from t_gp where k = 'a');
begin
  perform public.save_product(jsonb_build_object('id', a, 'slug', 'tst-pack-amber', 'name', 'Pack Amber', 'base_price', 1500, 'is_active', true,
    'primary_category_id', (select id from public.categories order by created_at limit 1),
    'variants', jsonb_build_array(jsonb_build_object('id', (select id from public.product_variants where sku = 'TST-PA-30'), 'sku', 'TST-PA-30', 'kind', 'retail', 'size_ml', 30, 'label', '30 ml'))));
  assert exists (select 1 from public.product_variants where product_id = a and purpose = 'gift_pack_fill'), 'the pour size survives a save';
  assert (select stock_ml from public.products where id = a) = 200, 'removing the 100 ml size didn''t pour the liquid away';
end $$;

-- Returns: a pack received back in good condition puts its perfumes back; a replacement pack takes them again.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000033c1","role":"authenticated"}', true);
do $$
declare a uuid := (select id from t_gp where k = 'a'); b uuid := (select id from t_gp where k = 'b'); o jsonb;
begin
  o := public.create_order('00000000-0000-0000-0000-00000033ad01',
    jsonb_build_array(jsonb_build_object('key', 'pk2', 'picks', jsonb_build_array(a, a, a, b, b))), null, 'COD');
  perform set_config('test.pack_order', o ->> 'id', true);
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000033a1","role":"authenticated"}', true);
do $$
declare oid uuid := current_setting('test.pack_order')::uuid;
begin
  assert (select stock_ml from public.products where id = (select id from t_gp where k = 'a')) = 140, 'second pack poured 60 ml of Amber';
  perform public.set_order_status(oid, 'PACKED', null);
  perform public.ship_order(oid, 'other', 'TRK-GP', null);
  perform public.set_order_status(oid, 'DELIVERED', null);
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000033c1","role":"authenticated"}', true);
do $$
declare oid uuid := current_setting('test.pack_order')::uuid; rid uuid;
begin
  rid := public.request_return(oid, 'WRONG_ITEM', null,
    jsonb_build_array(jsonb_build_object('order_item_id', (select id from public.order_items where order_id = oid and line_type = 'item'), 'qty', 1)), '[]'::jsonb);
  perform set_config('test.pack_return', rid::text, true);
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000033a1","role":"authenticated"}', true);
do $$
declare rid uuid := current_setting('test.pack_return')::uuid; a uuid := (select id from t_gp where k = 'a'); nid uuid;
begin
  perform public.review_return(rid, true, null, 'POST');
  perform public.receive_return(rid, 'RESTOCK');
  assert (select stock_ml from public.products where id = a) = 200, 'the returned pack put its Amber back';
  nid := public.create_replacement_order(rid);
  assert (select count(*) from public.order_items where order_id = nid and line_type = 'pack_item'
          and parent_item_id = (select id from public.order_items where order_id = nid and line_type = 'item')) = 2, 'the replacement pack lists its perfumes';
  assert (select stock_ml from public.products where id = a) = 140, 'and pours them again';
end $$;
