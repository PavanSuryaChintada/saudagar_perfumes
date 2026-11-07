-- CMS seed: the storefront that existed before the CMS is fully present and readable by visitors.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare
  home jsonb := public.page_content('home');
  story jsonb := public.page_content('story');
  boot jsonb := public.site_bootstrap();
begin
  assert jsonb_array_length(home -> 'sections') = 13, 'home has its 13 sections';
  assert home -> 'sections' -> 0 ->> 'type' = 'hero_video_carousel', 'home starts with the hero films';
  assert jsonb_array_length(home -> 'sections' -> 0 -> 'config' -> 'slides') = 5, 'hero has five films';
  assert jsonb_array_length(story -> 'sections') = 5, 'story has its 5 sections';
  assert public.page_content('boutiques') is null, 'boutiques page is hidden from visitors';
  assert public.page_content('shipping-policy') ->> 'layout' = 'rich_text', 'policy pages exist';
  assert (boot -> 'blocks') ?& array['brand', 'theme', 'seo', 'mega_nav', 'mobile_drawer', 'footer', 'announcement_bar', 'stories_viewer'], 'every block is in the bootstrap';
  assert jsonb_array_length(coalesce(boot -> 'announcements', '[]')) = 0, 'seeded announcements start switched off';
end $$;
reset role;
do $$ begin
  assert (select count(*) from public.stories where product_id is not null) = 5, 'every story links its product';
  assert (select count(*) from public.reel_products) = 6, 'every reel tags its product';
  assert (select count(*) from public.testimonials where is_active) = 0, 'placeholder testimonials stay off';
end $$;
