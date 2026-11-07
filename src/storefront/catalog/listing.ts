// Shared listing logic for collection, category, note, search and shop pages.
// Filter sections are built from the admin-managed options; their state lives in the URL (see filters.ts).
import { ATTRIBUTE_KINDS, type AttributeKind, type ListingFilters } from './filters';
import type { CatalogFilters } from './types';

export interface FilterOption {
  id: string;
  label: string;
  desc?: string | null;
  badge?: string | null;
}

export interface FilterSection {
  id: string;
  title: string;
  subtitle?: string;
  options: FilterOption[];
}

export interface PriceBand {
  id: string;
  label: string;
  min: number | undefined;
  max: number | undefined;
}

const SECTION_COPY: Record<string, { title: string; subtitle?: string }> = {
  intensity: { title: 'SCENT INTENSITY', subtitle: 'Strength & Sillage' },
  families: { title: 'OLFACTORY NOTES', subtitle: 'Signature accords & botanicals' },
  occasion: { title: 'OCCASION & RITUAL', subtitle: 'Where & when to wear' },
  concentration: { title: 'CONCENTRATION', subtitle: 'Oil potency ratio' },
  family: { title: 'FRAGRANCE FAMILY', subtitle: 'The character of the scent' },
  gender: { title: 'WEAR IT AS' },
  season: { title: 'SEASON' },
  time_of_day: { title: 'DAY OR NIGHT' },
  longevity: { title: 'LONGEVITY', subtitle: 'Our guidance' },
  sillage: { title: 'SILLAGE', subtitle: 'How far it carries' },
  size: { title: 'BOTTLE SIZE' },
  price: { title: 'PRICE TIER', subtitle: 'Flacon investment' },
  availability: { title: 'AVAILABILITY' },
};

const SECTION_ORDER: string[] = [
  'intensity', 'families', 'occasion', 'concentration', 'family', 'gender', 'season', 'time_of_day', 'longevity', 'sillage',
];

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** Three price bands across the live catalogue's range, rounded to ₹500. */
export function priceBands(min: number | null | undefined, max: number | null | undefined): PriceBand[] {
  if (min === null || min === undefined || max === null || max === undefined || max <= min) return [];
  const span = max - min;
  const low = roundTo(min + span / 3, 500);
  const high = Math.max(low + 500, roundTo(min + (2 * span) / 3, 500));
  return [
    { id: `under-${low}`, label: `Under ${inr(low)}`, min: undefined, max: low - 1 },
    { id: `${low}-${high}`, label: `${inr(low)} – ${inr(high)}`, min: low, max: high },
    { id: `above-${high}`, label: `Above ${inr(high)}`, min: high + 1, max: undefined },
  ];
}

export function buildFilterSections(catalog: CatalogFilters | undefined): FilterSection[] {
  if (!catalog) return [];
  const sections: FilterSection[] = [];
  for (const id of SECTION_ORDER) {
    const kind = id === 'families' ? 'note_family' : id;
    const options = (catalog.options?.[kind] ?? []).map((o) => ({ id: o.slug, label: o.label, desc: o.description, badge: o.badge }));
    if (options.length) sections.push({ id, ...SECTION_COPY[id], options });
  }
  if (catalog.sizes?.length) {
    sections.push({ id: 'size', ...SECTION_COPY.size, options: catalog.sizes.map((ml) => ({ id: String(ml), label: `${ml} ml` })) });
  }
  const bands = priceBands(catalog.price?.min, catalog.price?.max);
  if (bands.length) sections.push({ id: 'price', ...SECTION_COPY.price, options: bands.map((b) => ({ id: b.id, label: b.label })) });
  sections.push({ id: 'availability', ...SECTION_COPY.availability, options: [{ id: 'in-stock', label: 'In stock only' }] });
  return sections;
}

const toggle = <T,>(list: T[] | undefined, value: T): T[] => {
  const set = new Set(list ?? []);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return [...set];
};

/** Returns new filters with one sidebar option toggled. Any change goes back to page 1. */
export function toggleFilter(f: ListingFilters, sectionId: string, optionId: string, bands: PriceBand[]): ListingFilters {
  const next: ListingFilters = { ...f, attrs: { ...f.attrs } };
  delete next.page;
  if (sectionId === 'families') {
    const v = toggle(f.families, optionId);
    if (v.length) next.families = v;
    else delete next.families;
  } else if (sectionId === 'size') {
    const v = toggle(f.sizes, Number(optionId));
    if (v.length) next.sizes = v;
    else delete next.sizes;
  } else if (sectionId === 'availability') {
    if (f.inStock) delete next.inStock;
    else next.inStock = true;
  } else if (sectionId === 'price') {
    const band = bands.find((b) => b.id === optionId);
    const isActive = band && f.min === band.min && f.max === band.max;
    delete next.min;
    delete next.max;
    if (band && !isActive) {
      if (band.min !== undefined) next.min = band.min;
      if (band.max !== undefined) next.max = band.max;
    }
  } else if ((ATTRIBUTE_KINDS as readonly string[]).includes(sectionId)) {
    const kind = sectionId as AttributeKind;
    const v = toggle(f.attrs[kind], optionId);
    if (v.length) next.attrs[kind] = v;
    else delete next.attrs[kind];
  }
  return next;
}

/** The sidebar's {sectionId: optionIds[]} view of the URL filters. */
export function activeFromFilters(f: ListingFilters, bands: PriceBand[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (f.families?.length) out.families = f.families;
  for (const [kind, vals] of Object.entries(f.attrs)) if (vals?.length) out[kind] = vals;
  if (f.sizes?.length) out.size = f.sizes.map(String);
  if (f.inStock) out.availability = ['in-stock'];
  const band = bands.find((b) => b.min === f.min && b.max === f.max);
  if (band && (f.min !== undefined || f.max !== undefined)) out.price = [band.id];
  return out;
}

/** Option counts for the sidebar, from search_products facets. Sections without facets show no count. */
export function sectionCounts(facets: Record<string, unknown> | undefined): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  if (!facets) return out;
  for (const [key, value] of Object.entries(facets)) {
    if (key === 'options' || typeof value !== 'object' || value === null) continue;
    out[key === 'note_family' ? 'families' : key] = value as Record<string, number>;
  }
  return out;
}

/** The label for an active filter chip. */
export function optionLabel(sections: FilterSection[], sectionId: string, optionId: string): string {
  return sections.find((s) => s.id === sectionId)?.options.find((o) => o.id === optionId)?.label ?? optionId;
}
