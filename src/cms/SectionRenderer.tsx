import { Component, Fragment, useMemo, type ReactNode } from 'react';
import { pickMedia, useIsPhone } from './mobileMedia';
import { SECTION_TYPES } from './registry';
import { useStorefront } from './StorefrontContext';
import { usePageContent } from './useSite';

/** One broken section must never take the whole page down. */
class SectionBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function SectionList({ sections }: { sections: { id: string; type: string; config: Record<string, any> }[] }) {
  const actions = useStorefront();
  // Each section gets the phone or desktop pictures for this screen (see cms/mobileMedia).
  const phone = useIsPhone();
  const shown = useMemo(() => sections.map((s) => ({ ...s, config: pickMedia(s.config || {}, phone) })), [sections, phone]);
  return (
    <>
      {shown.map((s) => {
        const def = SECTION_TYPES[s.type];
        if (!def) return null;
        const C = def.component;
        return (
          <Fragment key={s.id}>
            <SectionBoundary>
              <C config={s.config || {}} {...actions} />
            </SectionBoundary>
          </Fragment>
        );
      })}
    </>
  );
}

type SectionItem = { id: string; type: string; config: Record<string, any> };

/** Renders a section-built page by slug. While loading (or if it can't load) it shows `fallback`, if given. */
export function CmsSections({ slug, fallback, ensure }: { slug: string; fallback?: SectionItem[]; ensure?: string[] }) {
  const { data } = usePageContent(slug);
  const sections = useMemo(() => {
    const list = (data?.sections as SectionItem[] | undefined) ?? fallback ?? [];
    // Sections the page can't do without are added at the end if somehow missing.
    const missing = (ensure ?? []).filter((t) => !list.some((s) => s.type === t));
    return missing.length ? [...list, ...missing.map((t) => ({ id: `ensure-${t}`, type: t, config: {} }))] : list;
  }, [data, fallback, ensure]);
  if (!data && !fallback) return null;
  return <SectionList sections={sections} />;
}
