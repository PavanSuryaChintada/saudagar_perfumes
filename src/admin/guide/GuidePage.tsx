import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ChevronDown } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { GUIDE } from './guide';
import { GuideSteps, StatusPill } from './GuideSteps';
import { useGuideStatus } from './useGuideStatus';

/** /admin/guide: the whole store, step by step, in the order to do it the first time. */
export default function GuidePage() {
  const [params] = useSearchParams();
  const { data: status } = useGuideStatus();
  const firstTodo = GUIDE.find((s) => !s.optional && s.check && status?.[s.check]?.done === false)?.id;
  const [open, setOpen] = useState<Set<string>>(() => new Set(params.get('section') ? [params.get('section')!] : []));

  // Open the first step that still needs doing, once the progress has loaded.
  useEffect(() => {
    if (!params.get('section') && firstTodo) setOpen((o) => (o.size ? o : new Set([firstTodo])));
  }, [firstTodo, params]);
  useEffect(() => {
    const id = params.get('section');
    if (id) document.getElementById(`guide-${id}`)?.scrollIntoView({ block: 'start' });
  }, [params]);

  const toggle = (id: string) => setOpen((o) => {
    const next = new Set(o);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const required = GUIDE.filter((s) => !s.optional && s.check);
  const done = required.filter((s) => status?.[s.check!]?.done === true).length;

  return (
    <div className="max-w-[860px]">
      <PageHeader
        title="Guide"
        description="Everything the admin does, in the order to do it the first time. Each step links to the page that does it. Later, use the ? on any page to see just that page's steps."
      />
      <div className="mb-5 flex items-center gap-3 text-[14px]">
        <div className="h-1.5 flex-1 bg-[#E2E0DB]" aria-hidden>
          <div className="h-full bg-tk-accent transition-all" style={{ width: `${required.length ? (done / required.length) * 100 : 0}%` }} />
        </div>
        <span className="tabular-nums text-[#454545]">{status ? `${done} of ${required.length} set up` : 'Checking…'}</span>
      </div>

      <ol className="space-y-3">
        {GUIDE.map((s, i) => {
          const isOpen = open.has(s.id);
          return (
            <li key={s.id} id={`guide-${s.id}`} className="bg-white border border-[#E2E0DB] scroll-mt-6">
              <button
                type="button"
                onClick={() => toggle(s.id)}
                aria-expanded={isOpen}
                aria-controls={`guide-body-${s.id}`}
                className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-[#FAFAF8]"
              >
                <span className="h-7 w-7 shrink-0 bg-tk-ink text-white text-[13px] flex items-center justify-center tabular-nums">{i + 1}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] text-tk-ink">{s.title}</span>
                </span>
                <StatusPill status={s.check ? status?.[s.check] : undefined} optional={s.optional} />
                <ChevronDown size={16} className={`shrink-0 text-[#626262] transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              {isOpen && (
                <div id={`guide-body-${s.id}`} className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#E9E7E2]">
                  <GuideSteps section={s} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
