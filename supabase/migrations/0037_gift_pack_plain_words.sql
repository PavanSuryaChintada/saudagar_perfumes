-- 0037_gift_pack_plain_words: the gift pack words are plain sentences; the shop shows the numbers next to them
-- from the rules. Replaces any starting words that still hold {count}-style codes, and drops the old sample line.
update public.site_blocks set value = (value - 'sample_note') || jsonb_strip_nulls(jsonb_build_object(
  'tagline', case when value ->> 'tagline' like '%{%' then 'Your own selection of our perfumes, in one gift box.' end,
  'intro', case when value ->> 'intro' like '%{%' then 'Pick your favourites. You can choose the same perfume more than once.' end,
  'bag_text', case when value ->> 'bag_text' like '%{%' then 'Your own selection of our perfumes, in one gift box.' end))
where key = 'gift_pack';
