import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { CircleHelp } from 'lucide-react';
import { useGuidePanel } from '../guide/GuideContext';
import { sectionsFor } from '../guide/guide';

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  const guide = useGuidePanel();
  const { pathname } = useLocation();
  const hasHelp = !!guide && sectionsFor(pathname).length > 0;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6 pb-5 border-b border-[#E0DBD1]">
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="w-1 h-7 bg-tk-accent shrink-0" aria-hidden />
          <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-[#141414]">{title}</h1>
          {hasHelp && (
            <button
              type="button"
              onClick={guide!.openHelp}
              className="inline-flex items-center gap-1 text-[13px] text-[#4A4A4A] hover:text-tk-ink border border-[#D3D0C8] bg-white px-2 py-1"
            >
              <CircleHelp size={14} aria-hidden /> How this page works
            </button>
          )}
        </div>
        {description && <p className="mt-1.5 text-[14.5px] text-[#3F3F3F] max-w-[680px]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, children, action, id }: { title?: string; description?: string; children: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <section id={id} className="border border-[#E0DBD1] bg-white scroll-mt-20 shadow-[0_1px_2px_rgba(20,20,20,0.05)]">
      {title && (
        <header className="px-4 sm:px-5 py-3.5 bg-[#FAF8F4] border-b border-[#E0DBD1] flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h2 className="text-[15.5px] font-semibold text-[#141414] normal-case tracking-normal">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-[#4F4F4F]">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
