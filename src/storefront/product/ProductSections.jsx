import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router';
import { sanitizeHtml, hasText } from '../../lib/richText';
import { formatINR as formatPrice } from '../../lib/money';
import { useBlock } from '../../cms/useSite';

const TIERS = [
  { key: 'top', label: 'Top Notes', hint: 'The first impression' },
  { key: 'heart', label: 'Heart Notes', hint: 'The character' },
  { key: 'base', label: 'Base Notes', hint: 'What lingers' },
];

/** Top → heart → base, each note linking to every perfume that contains it. */
export function NotePyramid({ notes }) {
  const tiers = TIERS.filter((t) => (notes?.[t.key] ?? []).length > 0);
  if (tiers.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-10">
      {tiers.map((t) => (
        <div key={t.key}>
          <p className="text-[10.5px] uppercase tracking-[0.16em] text-tk-accent dark:text-tk-accent-night font-medium">{t.label}</p>
          <p className="text-[11px] text-[#999999] dark:text-white/40 mb-3">{t.hint}</p>
          <ul className="space-y-2.5">
            {notes[t.key].map((n) => (
              <li key={n.slug}>
                <Link to={`/notes/${n.slug}`} className="group flex items-center gap-3 text-[13px] text-tk-ink dark:text-white hover:text-tk-accent dark:hover:text-tk-accent-night transition-colors">
                  {n.image ? (
                    <img src={n.image} alt="" loading="lazy" className="w-9 h-9 object-cover rounded-full bg-[#F4F3EE] dark:bg-white/5 shrink-0" />
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-[#F4F3EE] dark:bg-white/5 shrink-0 flex items-center justify-center text-[11px] text-tk-accent dark:text-tk-accent-night">
                      {n.name.charAt(0)}
                    </span>
                  )}
                  <span className="underline-offset-4 group-hover:underline">{n.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Main accords as strength bars. */
export function AccordBars({ accords }) {
  if (!accords || accords.length === 0) return null;
  return (
    <div className="mb-10">
      <p className="text-[10.5px] uppercase tracking-[0.16em] text-[#777777] dark:text-[#999999] mb-3">Main Accords</p>
      <div className="space-y-2">
        {accords.map((a) => (
          <div key={a.slug} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-[12px] text-[#333333] dark:text-[#CCCCCC]">{a.label}</span>
            <div className="flex-1 h-[6px] bg-[#F0EEEA] dark:bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${a.strength ?? 60}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-tk-accent dark:bg-tk-accent-night"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PROFILE_ROWS = [
  ['family', 'Fragrance family'],
  ['concentration', 'Concentration'],
  ['intensity', 'Intensity'],
  ['longevity', 'Longevity'],
  ['sillage', 'Sillage'],
  ['season', 'Seasons'],
  ['time_of_day', 'Day / night'],
  ['occasion', 'Occasions'],
  ['gender', 'Wear it as'],
];

export function profileRows(attributes) {
  return PROFILE_ROWS.map(([kind, label]) => ({
    kind,
    label,
    value: (attributes?.[kind] ?? []).map((a) => a.label).join(' · '),
  })).filter((r) => r.value);
}

function Accordion({ id, title, open, onToggle, children }) {
  return (
    <div className="py-4">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        className="w-full flex items-center justify-between text-tk-ink dark:text-white font-normal hover:opacity-75 transition-opacity cursor-pointer text-left"
      >
        <span className="tracking-[0.02em] text-[13px]">{title}</span>
        <span className="text-[16px] font-light">{open ? '−' : '+'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden pt-3 pb-1 space-y-2 text-[#555555] dark:text-[#A09D96] text-[12px] leading-relaxed"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DefinitionList({ rows }) {
  return (
    <dl className="grid grid-cols-[minmax(110px,40%)_1fr] gap-x-4 gap-y-2">
      {rows.map((r) => (
        <React.Fragment key={r.label}>
          <dt className="text-[#888888] dark:text-white/50">{r.label}</dt>
          <dd className="text-[#222222] dark:text-[#DDDDDD] break-words">{r.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

/** Scent profile, story, the legally required details, and delivery — as accordions. */
export function ProductAccordions({ detail, selectedSize, openAccordion, onToggle, sampleCopy, etaText }) {
  const page = useBlock('product_page') || {};
  const own = Array.isArray(detail.page_sections) ? detail.page_sections : [];
  const defaults = detail.use_default_sections === false ? [] : Array.isArray(page.default_sections) ? page.default_sections : [];
  const extra = [...own, ...defaults].filter((x) => x && (x.title || '').trim() && hasText(x.body));
  const profile = profileRows(detail.attributes);
  const c = detail.compliance || {};
  const netQty = selectedSize?.ml ? `${selectedSize.ml} ml` : null;
  const compliance = [
    ['Net quantity', netQty],
    ['MRP (incl. of all taxes)', selectedSize ? formatPrice(selectedSize.compareAt && selectedSize.compareAt > selectedSize.price ? selectedSize.compareAt : selectedSize.price) : null],
    ['Country of origin', c.country_of_origin],
    ['Manufactured by', [c.manufacturer_name, c.manufacturer_address].filter(Boolean).join(', ')],
    ['Packed by', [c.packer_name, c.packer_address].filter(Boolean).join(', ')],
    ['Imported by', [c.importer_name, c.importer_address].filter(Boolean).join(', ')],
    ['Consumer care', c.consumer_care],
    ['Best before / shelf life', c.shelf_life],
    ['Ingredients', c.ingredients],
    ['Allergens', c.allergens],
    ['HSN code', c.hsn_code],
    ['GST', c.gst_rate !== null && c.gst_rate !== undefined ? `${Number(c.gst_rate)}% (included in price)` : null],
  ]
    .filter(([, v]) => v)
    .map(([label, value]) => ({ label, value }));

  const story = [
    ['Perfumer', detail.perfumer],
    ['Launched', detail.launch_year],
  ].filter(([, v]) => v).map(([label, value]) => ({ label, value }));
  const hasStory = story.length > 0 || hasText(detail.inspiration) || hasText(detail.how_to_wear);

  return (
    <div className="divide-y divide-[#EAEAEA] dark:divide-white/10 text-[12px]">
      {profile.length > 0 && (
        <Accordion id="profile" title={page.profile_title || 'Scent Profile'} open={openAccordion === 'profile'} onToggle={onToggle}>
          <DefinitionList rows={profile.map((r) => ({ label: r.label, value: r.value }))} />
          {page.profile_note && <p className="pt-2 text-[11px] text-[#999999] dark:text-white/40">{page.profile_note}</p>}
        </Accordion>
      )}
      {hasStory && (
        <Accordion id="story" title={page.story_title || 'The Story'} open={openAccordion === 'story'} onToggle={onToggle}>
          {story.length > 0 && <DefinitionList rows={story} />}
          {hasText(detail.inspiration) && (
            <div className="pt-2 [&_p]:mb-2" dangerouslySetInnerHTML={{ __html: sanitizeHtml(detail.inspiration) }} />
          )}
          {hasText(detail.how_to_wear) && (
            <div className="pt-1">
              <p className="text-tk-accent dark:text-tk-accent-night font-medium mb-1">How to wear</p>
              <div className="[&_p]:mb-2" dangerouslySetInnerHTML={{ __html: sanitizeHtml(detail.how_to_wear) }} />
            </div>
          )}
        </Accordion>
      )}
      <Accordion id="compliance" title={page.compliance_title || 'Details & Compliance'} open={openAccordion === 'compliance'} onToggle={onToggle}>
        <DefinitionList rows={compliance} />
        {c.caution_text && <p className="pt-2 text-[11px]">{c.caution_text}</p>}
      </Accordion>
      <Accordion id="shipping" title={page.delivery_title || 'Delivery & Free Samples'} open={openAccordion === 'shipping'} onToggle={onToggle}>
        <p>{etaText}</p>
        {sampleCopy && <p>{sampleCopy}</p>}
        {detail.ships_surface_only && page.surface_note && <p>{page.surface_note}</p>}
      </Accordion>
      {extra.map((x, i) => (
        <Accordion key={`extra-${i}`} id={`extra-${i}`} title={x.title} open={openAccordion === `extra-${i}`} onToggle={onToggle}>
          <div className="[&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: sanitizeHtml(x.body) }} />
        </Accordion>
      ))}
    </div>
  );
}
