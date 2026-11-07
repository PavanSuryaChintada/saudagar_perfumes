-- Catalog reads: search filters (AND across kinds, OR within), sort, facets, similar, suggest, detail, aliases.
-- Fixtures use tst- options/notes so the real catalog never changes the expected counts.

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000000d1', 'reads-admin@test.local', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000d1', 'admin');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);

do $$
declare
  ev uuid; da uuid; att uuid; ext uuid; wood uuid; nfam uuid;
  n_oud uuid; n_rose uuid; n_quix uuid; col uuid;
  base jsonb := '{"variants":[{"sku":"X","kind":"retail","size_ml":50,"label":"50 ml","initial_stock":5}]}';
begin
  insert into public.attribute_options (kind, label, slug) values ('occasion', 'Tst Evening', 'tst-evening') returning id into ev;
  insert into public.attribute_options (kind, label, slug) values ('occasion', 'Tst Daily', 'tst-daily') returning id into da;
  insert into public.attribute_options (kind, label, slug) values ('concentration', 'Tst Attar', 'tst-attar') returning id into att;
  insert into public.attribute_options (kind, label, slug) values ('concentration', 'Tst Extrait', 'tst-extrait') returning id into ext;
  insert into public.attribute_options (kind, label, slug) values ('family', 'Tst Woody', 'tst-woody') returning id into wood;
  insert into public.attribute_options (kind, label, slug) values ('note_family', 'Tst Woods', 'tst-woods') returning id into nfam;
  insert into public.notes (name, slug, family_option_id) values ('Tst Oud', 'tst-oud', nfam) returning id into n_oud;
  insert into public.notes (name, slug) values ('Tst Rose', 'tst-rose') returning id into n_rose;
  insert into public.notes (name, slug) values ('Quixoticnote', 'quixoticnote') returning id into n_quix;
  insert into public.collections (slug, name, aliases) values ('tst-royal', 'Tst Royal', array['tst-oud-royale']) returning id into col;

  perform public.save_product(jsonb_build_object('slug','tst-alpha','name','Tst Alpha','base_price',3000,'is_active',true,
    'variants', jsonb_build_array(jsonb_build_object('sku','TA-50','kind','retail','size_ml',50,'label','50 ml','initial_stock',5)),
    'collection_ids', jsonb_build_array(col),
    'notes', jsonb_build_array(jsonb_build_object('note_id',n_oud,'tier','base'), jsonb_build_object('note_id',n_rose,'tier','heart')),
    'attributes', jsonb_build_array(jsonb_build_object('option_id',ev), jsonb_build_object('option_id',att), jsonb_build_object('option_id',wood,'is_primary',true))));
  perform public.save_product(jsonb_build_object('slug','tst-beta','name','Tst Beta','base_price',5000,'is_active',true,
    'variants', jsonb_build_array(jsonb_build_object('sku','TB-50','kind','retail','size_ml',50,'label','50 ml','initial_stock',5)),
    'notes', jsonb_build_array(jsonb_build_object('note_id',n_rose,'tier','top')),
    'attributes', jsonb_build_array(jsonb_build_object('option_id',ev), jsonb_build_object('option_id',ext))));
  perform public.save_product(jsonb_build_object('slug','tst-gamma','name','Tst Gamma','base_price',4000,'is_active',true,
    'variants', jsonb_build_array(jsonb_build_object('sku','TG-50','kind','retail','size_ml',50,'label','50 ml','initial_stock',0)),
    'notes', jsonb_build_array(jsonb_build_object('note_id',n_quix,'tier','top')),
    'attributes', jsonb_build_array(jsonb_build_object('option_id',da), jsonb_build_object('option_id',ext))));
  perform public.save_product(jsonb_build_object('slug','tst-delta-hidden','name','Tst Delta','base_price',1000,'is_active',false,
    'variants', jsonb_build_array(jsonb_build_object('sku','TD-50','kind','retail','size_ml',50,'label','50 ml')),
    'attributes', jsonb_build_array(jsonb_build_object('option_id',ev))));
end $$;

-- ===== anon =====
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$
declare r jsonb; slugs text[];
begin
  r := public.search_products('{"attrs":{"occasion":["tst-evening"]}}');
  assert (r ->> 'total')::int = 2, format('one occasion → 2 live products, got %s', r ->> 'total');

  r := public.search_products('{"attrs":{"occasion":["tst-evening"],"concentration":["tst-attar"]}}');
  assert (r ->> 'total')::int = 1 and r -> 'items' -> 0 ->> 'slug' = 'tst-alpha', 'different kinds are ANDed';

  r := public.search_products('{"attrs":{"occasion":["tst-evening","tst-daily"]}, "sort":"price_asc"}');
  assert (r ->> 'total')::int = 3, 'options of one kind are ORed';
  select array_agg(x ->> 'slug' order by ord) into slugs from jsonb_array_elements(r -> 'items') with ordinality as t(x, ord);
  assert slugs = array['tst-alpha', 'tst-gamma', 'tst-beta'], format('price ascending, got %s', slugs);

  r := public.search_products('{"attrs":{"occasion":["tst-evening","tst-daily"]}, "in_stock": true}');
  assert (r ->> 'total')::int = 2, 'in-stock filter drops the zero-stock product';

  r := public.search_products('{"q":"quixoticnote"}');
  assert (r ->> 'total')::int = 1 and r -> 'items' -> 0 ->> 'slug' = 'tst-gamma', 'search matches a note name';

  r := public.search_products('{"collection":"tst-royal"}');
  assert (r ->> 'total')::int = 1, 'collection filter';

  r := public.search_products('{"attrs":{"occasion":["tst-evening"]}}');
  assert (r -> 'facets' -> 'occasion' ->> 'tst-daily')::int = 1, 'facet counts ignore attribute filters';

  r := public.search_products('{"slugs":["tst-beta","tst-alpha","tst-delta-hidden"]}');
  assert (r ->> 'total')::int = 2, 'slugs lookup never returns hidden products';

  r := public.search_products('{"note_families":["tst-woods"]}');
  assert (r ->> 'total')::int = 1, 'note family filter';

  r := public.search_products('{"attrs":{"occasion":["tst-evening"]}}');
  assert jsonb_array_length(r -> 'items' -> 0 -> 'sizes') = 1, 'cards include sizes';
  assert (r -> 'items' -> 0 ->> 'rating_count')::int = 0, 'no fake ratings';
end $$;

do $$
declare r jsonb;
begin
  r := public.similar_products('tst-beta', 4);
  assert r -> 0 ->> 'slug' = 'tst-alpha', format('shared note ranks first, got %s', r -> 0 ->> 'slug');
  assert not exists (select 1 from jsonb_array_elements(r) x where x ->> 'slug' = 'tst-beta'), 'similar excludes itself';

  assert public.product_detail('tst-delta-hidden') is null, 'inactive product has no public detail';
  r := public.product_detail('tst-alpha');
  assert r -> 'notes' -> 'base' -> 0 ->> 'name' = 'Tst Oud', 'detail groups notes by tier';
  assert r -> 'attributes' -> 'family' -> 0 ->> 'slug' = 'tst-woody', 'detail groups attributes by kind';

  assert public.resolve_collection('tst-oud-royale') ->> 'slug' = 'tst-royal', 'old link alias resolves';
  assert public.resolve_collection('tst-royal') ->> 'slug' = 'tst-royal', 'slug resolves';
  assert public.resolve_collection('nope-nope') is null, 'unknown collection is null';

  r := public.search_suggest('quixotic');
  assert r -> 'products' -> 0 ->> 'slug' = 'tst-gamma', 'suggest finds a product by note';
  assert r -> 'notes' -> 0 ->> 'slug' = 'quixoticnote', 'suggest finds the note';

  r := public.catalog_filters();
  assert (select count(*) from jsonb_array_elements(r -> 'options' -> 'occasion') x where x ->> 'slug' like 'tst-%') = 2,
    'filters list options by kind';
end $$;
reset role;
