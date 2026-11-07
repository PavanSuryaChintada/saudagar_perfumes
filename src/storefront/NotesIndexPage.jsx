import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { useCatalogFilters } from './catalog/hooks';
import ListingHeader from './ListingHeader.jsx';

/** Every note, grouped by note family; each links to the perfumes that contain it. */
export default function NotesIndexPage() {
  const { data, isLoading } = useCatalogFilters();
  useEffect(() => {
    document.title = 'FRAGRANCE NOTES | SAUDAGAR PERFUMES';
  }, []);

  const groups = useMemo(() => {
    if (!data) return [];
    const families = data.options?.note_family ?? [];
    const bySlug = new Map(families.map((f) => [f.slug, { label: f.label, notes: [] }]));
    const other = { label: 'More notes', notes: [] };
    for (const n of data.notes ?? []) (bySlug.get(n.family) ?? other).notes.push(n);
    return [...bySlug.values(), other].filter((g) => g.notes.length > 0);
  }, [data]);

  return (
    <div className="w-full min-h-screen bg-white dark:bg-tk-night text-tk-ink dark:text-white pb-28">
      <ListingHeader eyebrow="The Library" title="Fragrance Notes" description="Explore by ingredient. Each note leads to every Saudagar creation that carries it." />
      <div className="px-4 sm:px-8 lg:px-12 py-12 space-y-12">
        {isLoading && <p className="text-[12.5px] text-[#888888]">Loading notes…</p>}
        {groups.map((g) => (
          <section key={g.label}>
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-tk-accent dark:text-tk-accent-night mb-4">{g.label}</h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3">
              {g.notes.map((n) => (
                <li key={n.slug}>
                  <Link to={`/notes/${n.slug}`} className="flex items-center gap-3 text-[13px] hover:text-tk-accent dark:hover:text-tk-accent-night transition-colors">
                    {n.image ? (
                      <img src={n.image} alt="" className="w-8 h-8 rounded-full object-cover bg-[#F4F3EE] dark:bg-white/5" loading="lazy" />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-[#F4F3EE] dark:bg-white/5 flex items-center justify-center text-[11px] text-tk-accent dark:text-tk-accent-night shrink-0">
                        {n.name.charAt(0)}
                      </span>
                    )}
                    <span className="truncate">{n.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
