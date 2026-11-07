-- CMS: pages, sections, blocks, announcements window, system pages, duplicate, RLS.
insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000000f1', 'cms-admin@test.local', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000f2', 'cms-cust@test.local', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000f1', 'admin');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}', true);
do $$
declare live uuid; draft uuid; s1 uuid; s2 uuid; s3 uuid; dup uuid;
begin
  insert into public.pages (slug, title, layout, is_published) values ('tst-live', 'Live', 'sections', true) returning id into live;
  insert into public.pages (slug, title, layout, is_published) values ('tst-draft', 'Draft', 'rich_text', false) returning id into draft;
  insert into public.pages (slug, title, is_system) values ('tst-system', 'System', true);
  insert into public.website_sections (page_id, section_type, position, config) values (live, 'rich_text', 0, '{"heading":"One"}') returning id into s1;
  insert into public.website_sections (page_id, section_type, position, is_visible, config) values (live, 'faq', 1, false, '{}') returning id into s2;
  insert into public.website_sections (page_id, section_type, position, config) values (live, 'kinetic_marquee', 2, '{"items":["A"]}') returning id into s3;

  dup := public.duplicate_section(s1);
  assert (select position from public.website_sections where id = dup) = 1, 'copy sits right after the original';
  assert (select position from public.website_sections where id = s3) = 3, 'later sections move down';
  assert (select config ->> 'heading' from public.website_sections where id = dup) = 'One', 'copy keeps the config';

  perform public.reorder_rows('website_sections', array[s3, s1, dup, s2]);
  assert (select position from public.website_sections where id = s3) = 0, 'sections reorder';

  begin
    delete from public.pages where slug = 'tst-system';
    raise exception 'TEST_FAIL: system page deleted';
  exception when others then
    if sqlerrm not like 'PAGE_SYSTEM%' then raise exception 'expected PAGE_SYSTEM, got %', sqlerrm; end if;
  end;

  insert into public.announcements (text, is_active, starts_at, ends_at, position) values
    ('tst live now', true, now() - interval '1 day', now() + interval '1 day', 0),
    ('tst not yet', true, now() + interval '1 day', null, 1),
    ('tst expired', true, null, now() - interval '1 hour', 2),
    ('tst off', false, null, null, 3);
  insert into public.site_blocks (key, value) values ('tst_block', '{"hello":"world"}')
    on conflict (key) do update set value = excluded.value;

  assert public.page_content('tst-draft') is not null, 'admin can preview an unpublished page';
end $$;

-- ===== anon =====
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare pc jsonb; boot jsonb;
begin
  pc := public.page_content('tst-live');
  assert pc ->> 'title' = 'Live', 'published page is public';
  assert jsonb_array_length(pc -> 'sections') = 3, format('hidden section excluded, got %s', jsonb_array_length(pc -> 'sections'));
  assert pc -> 'sections' -> 0 ->> 'type' = 'kinetic_marquee', 'sections come in position order';
  assert public.page_content('tst-draft') is null, 'unpublished page is private';
  assert public.page_content('nope') is null, 'unknown page is null';
  assert not exists (select 1 from public.website_sections where not is_visible), 'anon cannot read hidden sections directly';

  boot := public.site_bootstrap();
  assert boot -> 'blocks' -> 'tst_block' ->> 'hello' = 'world', 'bootstrap carries site blocks';
  assert (select count(*) from jsonb_array_elements(boot -> 'announcements') a where a ->> 'text' like 'tst %') = 1,
    'only the announcement inside its window shows';
  assert boot -> 'settings' ->> 'store.name' is not null, 'bootstrap still carries settings';
end $$;

-- ===== customer =====
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f2","role":"authenticated"}', true);
do $$ begin
  begin
    insert into public.site_blocks (key, value) values ('hack', '{}');
    raise exception 'TEST_FAIL: customer wrote a site block';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.duplicate_section((select id from public.website_sections limit 1));
    raise exception 'TEST_FAIL: customer duplicated a section';
  exception when others then
    if sqlerrm not like 'NOT_ADMIN%' then raise exception 'expected NOT_ADMIN, got %', sqlerrm; end if;
  end;
end $$;
reset role;
