-- 0036_gift_pack_words: the starting gift pack words follow the rules ({count}, {size}, {sample} are filled in), so
-- changing the rules in Admin → Gift pack never leaves the words saying the old numbers. Only replaces the words
-- if they are still the ones 0033 started with.
update public.site_blocks set value = value || jsonb_build_object(
  'tagline', '{count} perfumes of your choice, {size} ml each, in one gift box.',
  'intro', 'Pick any {count} perfumes. Choose the same one more than once if you like.',
  'bag_text', '{count} perfumes of your choice, {size} ml each, in one gift box.',
  'sample_note', 'A free {sample} ml sample comes with every pack.')
where key = 'gift_pack' and value ->> 'tagline' = 'Five perfumes of your choice, 20 ml each, in one gift box.';
