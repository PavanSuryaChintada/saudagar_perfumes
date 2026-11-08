-- 0031_mobile_media: a phone version for pictures kept in tables (stories, reels, testimonials, boutiques,
-- categories, collections). Keys are the picture's column, e.g. {"image_url": "https://…/phone.jpg"}.
-- Page sections and site blocks keep theirs next to the picture as `<key>_mobile` inside their JSON.
do $$
declare t text;
begin
  foreach t in array array['stories', 'reels', 'testimonials', 'stockists', 'categories', 'collections'] loop
    execute format('alter table public.%I add column if not exists mobile_media jsonb not null default ''{}''::jsonb', t);
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_mobile_media_object');
    execute format('alter table public.%I add constraint %I check (jsonb_typeof(mobile_media) = ''object'')', t, t || '_mobile_media_object');
  end loop;
end $$;
notify pgrst, 'reload schema';
