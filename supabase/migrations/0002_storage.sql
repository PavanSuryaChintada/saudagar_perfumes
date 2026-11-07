-- 0002 Storage: buckets, object policies, media library table.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('media', 'media', true, 52428800,
    array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','image/avif','video/mp4','video/webm','video/quicktime']),
  ('reviews', 'reviews', true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('returns', 'returns', false, 52428800,
    array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- media: anyone reads, admins write
drop policy if exists saudagar_media_read on storage.objects;
create policy saudagar_media_read on storage.objects for select to anon, authenticated
  using (bucket_id in ('media', 'reviews'));
drop policy if exists saudagar_media_insert on storage.objects;
create policy saudagar_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
drop policy if exists saudagar_media_update on storage.objects;
create policy saudagar_media_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());
drop policy if exists saudagar_media_delete on storage.objects;
create policy saudagar_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

-- reviews + returns: customers write only inside their own uid folder
drop policy if exists saudagar_own_upload on storage.objects;
create policy saudagar_own_upload on storage.objects for insert to authenticated
  with check (bucket_id in ('reviews', 'returns') and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists saudagar_own_delete on storage.objects;
create policy saudagar_own_delete on storage.objects for delete to authenticated
  using (bucket_id in ('reviews', 'returns') and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists saudagar_returns_read on storage.objects;
create policy saudagar_returns_read on storage.objects for select to authenticated
  using (bucket_id = 'returns' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- media library
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  path text not null,
  url text not null,
  kind text not null check (kind in ('image', 'video', 'other')),
  mime text,
  bytes bigint,
  width int,
  height int,
  alt text,
  original_name text,
  uploaded_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);
create index if not exists media_assets_created_idx on public.media_assets (created_at desc);
alter table public.media_assets enable row level security;
drop policy if exists media_assets_admin on public.media_assets;
create policy media_assets_admin on public.media_assets for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.media_assets to authenticated;
