-- Search panel suggestions become editable (Admin → Site content → Search).
insert into public.site_blocks (key, value) values ('search', $q${"popular_heading":"Trending Formulations & Rare Extraits:","popular":["Oud Extrait","Discovery Coffret","Taif Rose","Deep Canopy","Bergamot","Sandalwood","Ambergris","Solar Citrus"]}$q$::jsonb)
on conflict (key) do nothing;
