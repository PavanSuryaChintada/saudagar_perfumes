import { Component, Fragment, type ReactNode } from 'react';
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
  return (
    <>
      {sections.map((s) => {
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

/** Renders a section-built page by slug. Shows nothing while loading. */
export function CmsSections({ slug }: { slug: string }) {
  const { data } = usePageContent(slug);
  if (!data) return null;
  return <SectionList sections={data.sections} />;
}
