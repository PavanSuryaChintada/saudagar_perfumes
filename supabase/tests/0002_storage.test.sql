-- Storage buckets and media_assets RLS.
do $$ begin
  assert (select public from storage.buckets where id = 'media'), 'media bucket is public';
  assert (select public from storage.buckets where id = 'reviews'), 'reviews bucket is public';
  assert not (select public from storage.buckets where id = 'returns'), 'returns bucket is private';
  assert (select file_size_limit from storage.buckets where id = 'media') = 52428800, 'media limit is 50 MB';
end $$;

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000000b1', 'media-cust@test.local', '{}', 'authenticated', 'authenticated');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
do $$ begin
  begin
    insert into public.media_assets (bucket, path, url, kind) values ('media', 'images/x.webp', 'https://x', 'image');
    raise exception 'TEST_FAIL: customer inserted into media_assets';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
