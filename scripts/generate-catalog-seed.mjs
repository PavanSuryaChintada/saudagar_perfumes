// HISTORICAL one-off generator (ran once, output committed as supabase/migrations/0006_seed_catalog.sql).
// The source files it read (ALL_PRODUCTS, collectionThemes.js, fragranceFilters.js) were deleted afterwards;
// see commit d048df5 to run it again.
// Run with: npx jiti scripts/generate-catalog-seed.mjs
// Memberships and scent-profile tags are computed with the storefront's original rules, so pages show the same
// products they did before. Everything it writes is sample content for the owner to replace.
import { writeFileSync } from 'node:fs';
import { ALL_PRODUCTS } from '../src/data/bluorngSaudagarData.js';
import { COLLECTION_THEMES, filterProductsByTheme } from '../src/data/collectionThemes.js';
import { FILTER_SECTIONS, classifyProduct } from '../src/data/fragranceFilters.js';

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const section = (id) => FILTER_SECTIONS.find((s) => s.id === id);
const options = [];
const addOption = (kind, slug, label, extra = {}) => {
  if (!options.some((o) => o.kind === kind && o.slug === slug)) {
    options.push({ kind, slug, label, description: extra.description ?? null, badge: extra.badge ?? null, position: options.filter((o) => o.kind === kind).length });
  }
};

section('intensity').options.forEach((o) => addOption('intensity', o.id, o.label, { description: o.desc, badge: o.badge }));
section('notes').options.forEach((o) => addOption('note_family', o.id, o.label));
section('occasion').options.forEach((o) => addOption('occasion', o.id, o.label, { description: o.desc }));
[
  ['extrait', 'Extrait de Parfum', 'Highest oil concentration'],
  ['parfum', 'Parfum', null],
  ['edp', 'Eau de Parfum', 'Rich day-to-night projection'],
  ['edt', 'Eau de Toilette', null],
  ['edc', 'Eau de Cologne', null],
  ['attar', 'Attar', 'Alcohol-free pure perfume oil'],
  ['body-mist', 'Body Mist', null],
  ['set', 'Discovery Set', 'Curated tasting flights'],
].forEach(([slug, label, description]) => addOption('concentration', slug, label, { description }));

const NOTE_FAMILY_TO_FAMILY = {
  oud: ['oud', 'Oud'], rose: ['floral', 'Floral'], amber: ['amber', 'Amber'], woody: ['woody', 'Woody'],
  citrus: ['citrus', 'Citrus'], aquatic: ['aquatic', 'Aquatic'], spices: ['spicy', 'Spicy'], leather: ['leather', 'Leather'],
};
Object.values(NOTE_FAMILY_TO_FAMILY).forEach(([slug, label]) => {
  addOption('family', slug, label);
  addOption('accord', slug, label);
});
addOption('family', 'fougere', 'Fougère');
[['feminine', 'Feminine'], ['masculine', 'Masculine'], ['unisex', 'Unisex']].forEach(([s, l]) => addOption('gender', s, l));
[['spring', 'Spring'], ['summer', 'Summer'], ['autumn', 'Autumn'], ['winter', 'Winter']].forEach(([s, l]) => addOption('season', s, l));
[['day', 'Day'], ['night', 'Night']].forEach(([s, l]) => addOption('time_of_day', s, l));
[['light', 'Light (2–4 hours)'], ['moderate', 'Moderate (4–6 hours)'], ['long', 'Long lasting (6–10 hours)'], ['very-long', 'Very long (10+ hours)']]
  .forEach(([s, l]) => addOption('longevity', s, l));
[['intimate', 'Intimate'], ['moderate', 'Moderate'], ['strong', 'Strong'], ['enormous', 'Enormous']].forEach(([s, l]) => addOption('sillage', s, l));

const LONGEVITY = { soft: 'light', moderate: 'moderate', intense: 'long', beastmode: 'very-long' };
const SILLAGE = { soft: 'intimate', moderate: 'moderate', intense: 'strong', beastmode: 'enormous' };
const SEASONS = { summer: ['summer', 'spring'], evening: ['autumn', 'winter'], 'date-night': ['autumn'], daily: ['spring'], meditative: ['winter'] };
const TIME = { summer: 'day', daily: 'day', evening: 'night', 'date-night': 'night', meditative: 'night' };

// ---------------------------------------------------------------- notes
const noteGroups = section('notes').options;
const familyOf = (name) => {
  const lower = name.toLowerCase();
  return noteGroups.find((g) => g.keywords?.some((kw) => lower.includes(kw)))?.id ?? null;
};
const notes = [];
const isAccessory = (p) => (p.category || '').toLowerCase() === 'accessories';
for (const p of ALL_PRODUCTS) {
  if (isAccessory(p)) continue;
  for (const tier of ['top', 'heart', 'base']) {
    for (const name of p.notes?.[tier] ?? []) {
      if (!notes.some((n) => n.name.toLowerCase() === name.toLowerCase())) {
        notes.push({ name, slug: slugify(name), family: familyOf(name), position: notes.length });
      }
    }
  }
}

// ---------------------------------------------------------------- categories
const categories = [];
for (const p of ALL_PRODUCTS) {
  if (p.category && !categories.some((c) => c.name === p.category)) {
    categories.push({ name: p.category, slug: slugify(p.category), position: categories.length });
  }
}

// ---------------------------------------------------------------- collections
const ALIASES = {
  signature: ['all', 'new-in', 'discovery-sets', 'bespoke-atelier', 'bespoke'],
  royal: ['oud-royale', 'royal-attars'],
  exotic: ['dark', 'obsidian', 'noir'],
  fresh: ['aquatic', 'solar-citrus', 'solar', 'citrus'],
};
const collections = Object.values(COLLECTION_THEMES).map((t, i) => ({
  slug: t.slug,
  name: t.name,
  short_name: t.shortName,
  headline: t.headline,
  tagline: t.tagline,
  descriptor: t.descriptor,
  notes_subtitle: t.notesSubtitle,
  image_url: t.hero?.poster ?? null,
  hero_video_url: t.hero?.video ?? null,
  hero_poster_url: t.hero?.poster ?? null,
  hero_badge: t.hero?.badge ?? null,
  hero_title: t.hero?.title ?? null,
  hero_tagline: t.hero?.tagline ?? null,
  hero_subtext: t.hero?.subtext ?? null,
  hero_accent_tag: t.hero?.accentTag ?? null,
  aliases: ALIASES[t.slug] ?? [],
  position: i,
  products: filterProductsByTheme(t.id, ALL_PRODUCTS, []).map((p) => p.id),
}));
collections.push({
  slug: 'latest-drop', name: 'Latest Drop', short_name: 'Latest Drop', headline: 'THE LATEST DROP', aliases: ['latest'],
  position: collections.length, products: ALL_PRODUCTS.slice(0, 8).map((p) => p.id),
});
collections.push({
  slug: 'exclusive-coffrets', name: 'Exclusive Coffrets', short_name: 'Coffrets', headline: 'PRIVATE VAULT', aliases: ['coffrets'],
  position: collections.length, products: ALL_PRODUCTS.filter((p) => p.collection === 'Exclusive Coffrets').map((p) => p.id),
});

// ---------------------------------------------------------------- products
const titleCase = (s) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
const skuBase = (slug) => slug.replace(/^saudagar-/, '').replace(/-/g, '').toUpperCase().slice(0, 14);
const variantLabel = (size) => {
  const ml = size.ml;
  const rest = String(size.label || '').replace(/\d+\s*ml/i, '').trim();
  return rest ? `${ml} ml · ${titleCase(rest)}` : `${ml} ml`;
};

const products = ALL_PRODUCTS.map((p) => {
  const meta = classifyProduct(p);
  const accessory = isAccessory(p);
  const isSet = (p.category || '').toLowerCase().includes('discovery') || /coffret/i.test(p.name);
  const isAttar = (p.category || '').toLowerCase().includes('attar');
  const counts = !accessory && !isSet;
  const allNotes = accessory ? [] : ['top', 'heart', 'base'].flatMap((tier) => (p.notes?.[tier] ?? []).map((name, i) => ({ slug: slugify(name), tier, position: i })));

  const familyCounts = {};
  for (const n of allNotes) {
    const fam = notes.find((x) => x.slug === n.slug)?.family;
    if (fam) familyCounts[fam] = (familyCounts[fam] ?? 0) + 1;
  }
  const rankedFamilies = Object.entries(familyCounts).sort((a, b) => b[1] - a[1]).map(([f]) => f);
  const attributes = [];
  if (!accessory) {
    attributes.push({ kind: 'intensity', slug: meta.intensity });
    meta.occasions.forEach((o) => attributes.push({ kind: 'occasion', slug: o }));
    attributes.push({ kind: 'concentration', slug: meta.concentrationType });
    if (rankedFamilies[0]) attributes.push({ kind: 'family', slug: NOTE_FAMILY_TO_FAMILY[rankedFamilies[0]][0], is_primary: true });
    if (/fougere/i.test(p.category || '')) attributes.push({ kind: 'family', slug: 'fougere' });
    rankedFamilies.slice(0, 3).forEach((f, i) => attributes.push({ kind: 'accord', slug: NOTE_FAMILY_TO_FAMILY[f][0], strength: [100, 75, 50][i] }));
    attributes.push({ kind: 'gender', slug: 'unisex' });
    const seasons = new Set(meta.occasions.flatMap((o) => SEASONS[o] ?? []));
    seasons.forEach((s) => attributes.push({ kind: 'season', slug: s }));
    const times = new Set(meta.occasions.map((o) => TIME[o]).filter(Boolean));
    times.forEach((t) => attributes.push({ kind: 'time_of_day', slug: t }));
    attributes.push({ kind: 'longevity', slug: LONGEVITY[meta.intensity] });
    attributes.push({ kind: 'sillage', slug: SILLAGE[meta.intensity] });
  }
  // unique by kind+slug
  const seen = new Set();
  const uniqueAttributes = attributes.filter((a) => {
    const k = `${a.kind}:${a.slug}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const variants = (p.sizes ?? []).map((s, i) => ({
    kind: 'retail',
    sku: `SAU-${skuBase(p.id)}-${s.ml}`,
    size_ml: s.ml,
    label: variantLabel(s),
    price: s.price && s.price !== p.price ? s.price : null,
    stock: 25,
    weight_g: Math.round(s.ml * 4 + 250),
    position: i,
  }));
  if (counts) {
    variants.push({ kind: 'sample', sku: `SAU-${skuBase(p.id)}-S5`, size_ml: 5, label: '5 ml sample', price: null, stock: 20, weight_g: 15, position: variants.length, in_sample_pool: true });
  }

  return {
    slug: p.id,
    name: p.name,
    short_description: p.description,
    description: `<p>${p.description}</p>`,
    category_slug: slugify(p.category),
    base_price: p.price,
    compare_at_price: p.compareAtPrice ?? null,
    badge: p.badge ?? null,
    concentration_note: p.concentration ?? null,
    is_featured: ['BESTSELLER', 'NEW DROP', 'ICONIC GIFT', 'SIGNATURE'].includes(p.badge),
    counts_toward_samples: counts,
    ships_surface_only: !accessory && !isAttar,
    images: p.images ?? (p.image ? [p.image] : []),
    notes: allNotes,
    attributes: uniqueAttributes,
    variants,
  };
});

const data = { options, notes, categories, collections, products };
const json = JSON.stringify(data, null, 1);
if (json.includes('$json$')) throw new Error('Seed data contains the dollar-quote delimiter');

const sql = `-- 0006 SAMPLE CATALOG (generated by scripts/generate-catalog-seed.mjs from the original storefront data).
-- Every product here is sample content: replace names, prices, photos, notes and compliance details in the admin.
-- Idempotent: rows that already exist (by slug / sku) are left untouched.

do $seed$
declare
  data jsonb := $json$${json}$json$::jsonb;
  o jsonb; n jsonb; c jsonb; p jsonb; v jsonb; a jsonb; img text;
  pid uuid; vid uuid; cid uuid; pos int; slug_text text;
begin
  for o in select * from jsonb_array_elements(data -> 'options') loop
    insert into public.attribute_options (kind, slug, label, description, badge, position)
    values (o ->> 'kind', o ->> 'slug', o ->> 'label', o ->> 'description', o ->> 'badge', (o ->> 'position')::int)
    on conflict (kind, slug) do nothing;
  end loop;

  for n in select * from jsonb_array_elements(data -> 'notes') loop
    insert into public.notes (name, slug, family_option_id, position)
    values (n ->> 'name', n ->> 'slug',
      (select id from public.attribute_options where kind = 'note_family' and slug = n ->> 'family'), (n ->> 'position')::int)
    on conflict do nothing;
  end loop;

  for c in select * from jsonb_array_elements(data -> 'categories') loop
    insert into public.categories (name, slug, position) values (c ->> 'name', c ->> 'slug', (c ->> 'position')::int)
    on conflict (slug) do nothing;
  end loop;

  for c in select * from jsonb_array_elements(data -> 'collections') loop
    insert into public.collections (slug, name, short_name, headline, tagline, descriptor, notes_subtitle, image_url,
      hero_video_url, hero_poster_url, hero_badge, hero_title, hero_tagline, hero_subtext, hero_accent_tag, aliases, position)
    values (c ->> 'slug', c ->> 'name', c ->> 'short_name', c ->> 'headline', c ->> 'tagline', c ->> 'descriptor', c ->> 'notes_subtitle',
      c ->> 'image_url', c ->> 'hero_video_url', c ->> 'hero_poster_url', c ->> 'hero_badge', c ->> 'hero_title', c ->> 'hero_tagline',
      c ->> 'hero_subtext', c ->> 'hero_accent_tag', array(select jsonb_array_elements_text(c -> 'aliases')), (c ->> 'position')::int)
    on conflict (slug) do nothing;
  end loop;

  for p in select * from jsonb_array_elements(data -> 'products') loop
    if exists (select 1 from public.products where slug = p ->> 'slug') then continue; end if;
    insert into public.products (slug, name, short_description, description, primary_category_id, base_price, compare_at_price,
      badge, concentration_note, is_featured, is_active, counts_toward_samples, ships_surface_only, country_of_origin, hsn_code,
      gst_rate, caution_text, admin_note)
    values (p ->> 'slug', p ->> 'name', p ->> 'short_description', p ->> 'description',
      (select id from public.categories where slug = p ->> 'category_slug'), (p ->> 'base_price')::numeric,
      nullif(p ->> 'compare_at_price', '')::numeric, p ->> 'badge', p ->> 'concentration_note', (p ->> 'is_featured')::boolean, true,
      (p ->> 'counts_toward_samples')::boolean, (p ->> 'ships_surface_only')::boolean, 'India', '3303', 18,
      'For external use only. Flammable: keep away from heat and open flame.',
      'SAMPLE PRODUCT from the original storefront. Replace the details, photos, prices and compliance information before launch.')
    returning id into pid;

    for v in select * from jsonb_array_elements(p -> 'variants') loop
      insert into public.product_variants (product_id, kind, sku, size_ml, label, price, weight_g, position, in_sample_pool)
      values (pid, v ->> 'kind', v ->> 'sku', (v ->> 'size_ml')::numeric, v ->> 'label', nullif(v ->> 'price', '')::numeric,
        (v ->> 'weight_g')::int, (v ->> 'position')::int, coalesce((v ->> 'in_sample_pool')::boolean, false))
      on conflict (sku) do nothing
      returning id into vid;
      if vid is not null and (v ->> 'stock')::int > 0 then
        perform app_private.apply_stock_change(vid, (v ->> 'stock')::int, 'initial', null, 'Sample opening stock');
      end if;
    end loop;

    pos := 0;
    for img in select * from jsonb_array_elements_text(p -> 'images') loop
      insert into public.product_media (product_id, kind, url, position) values (pid, 'image', img, pos);
      pos := pos + 1;
    end loop;

    for n in select * from jsonb_array_elements(p -> 'notes') loop
      insert into public.product_notes (product_id, note_id, tier, position)
      values (pid, (select id from public.notes where slug = n ->> 'slug'), n ->> 'tier', (n ->> 'position')::int)
      on conflict do nothing;
    end loop;

    for a in select * from jsonb_array_elements(p -> 'attributes') loop
      insert into public.product_attributes (product_id, option_id, strength, is_primary)
      select pid, id, nullif(a ->> 'strength', '')::int, coalesce((a ->> 'is_primary')::boolean, false)
      from public.attribute_options where kind = a ->> 'kind' and slug = a ->> 'slug'
      on conflict do nothing;
    end loop;
  end loop;

  for c in select * from jsonb_array_elements(data -> 'collections') loop
    select id into cid from public.collections where slug = c ->> 'slug';
    pos := 0;
    for slug_text in select * from jsonb_array_elements_text(c -> 'products') loop
      insert into public.product_collections (product_id, collection_id, position)
      select id, cid, pos from public.products where slug = slug_text
      on conflict do nothing;
      pos := pos + 1;
    end loop;
  end loop;

  perform app_private.refresh_product_search(id) from public.products;
end $seed$;
`;

writeFileSync('supabase/migrations/0006_seed_catalog.sql', sql);
console.log(`seed: ${options.length} options, ${notes.length} notes, ${categories.length} categories, ${collections.length} collections, ${products.length} products`);
