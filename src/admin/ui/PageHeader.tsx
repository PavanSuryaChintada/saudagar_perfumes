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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[22px] font-normal tracking-[-0.01em] text-tk-ink">{title}</h1>
          {hasHelp && (
            <button
              type="button"
              onClick={guide!.openHelp}
              className="inline-flex items-center gap-1 text-[13px] text-[#5A5A5A] hover:text-tk-ink border border-[#D3D0C8] bg-white px-2 py-1"
            >
              <CircleHelp size={14} aria-hidden /> How this page works
            </button>
          )}
        </div>
        {description && <p className="mt-1 text-[14px] text-[#525252] max-w-[640px]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, children }: { title?: string; description?: string; children: ReactNode }) {
  return (
    <section className="border border-[#E2E0DB] bg-white">
      {title && (
        <header className="px-4 sm:px-5 py-3.5 border-b border-[#E2E0DB]">
          <h2 className="text-[14px] font-medium text-tk-ink">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-[#5A5A5A]">{description}</p>}
        </header>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
