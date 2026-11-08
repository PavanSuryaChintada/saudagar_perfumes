import { Link } from 'react-router';
import { ArrowRight, Lightbulb } from 'lucide-react';
import type { GuideSection } from './guide';
import type { CheckStatus } from './useGuideStatus';

export function StatusPill({ status, optional }: { status?: CheckStatus; optional?: boolean }) {
  if (!status) return optional ? <span className="text-[10.5px] uppercase tracking-[0.08em] text-[#999999]">Optional</span> : null;
  const tone =
    status.done === true
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : status.done === false
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-[#F4F3EE] text-[#555555] border-[#E0DDD5]';
  return (
    <span className={`inline-block px-2 py-0.5 border text-[11px] whitespace-nowrap ${tone}`}>
      {status.done === true ? '✓ ' : ''}
      {status.text}
    </span>
  );
}

/** The numbered steps of one guide section, with a link to the page that does each step. */
export function GuideSteps({ section, onNavigate }: { section: GuideSection; onNavigate?: () => void }) {
  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-[#666666]">{section.why}</p>
      <ol className="space-y-2.5">
        {section.steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-[13px] text-tk-ink">
            <span className="mt-0.5 h-5 w-5 shrink-0 border border-[#D5D3CC] text-[11px] flex items-center justify-center tabular-nums">{i + 1}</span>
            <span className="min-w-0">
              {step.text}
              {step.link && (
                <Link to={step.link.to} onClick={onNavigate} className="ml-2 inline-flex items-center gap-1 text-[12px] text-tk-accent underline underline-offset-4 whitespace-nowrap">
                  {step.link.label} <ArrowRight size={12} aria-hidden />
                </Link>
              )}
            </span>
          </li>
        ))}
      </ol>
      {section.tip && (
        <p className="flex gap-2 text-[12.5px] bg-[#F8F7F5] border border-[#EAEAEA] px-3 py-2 text-[#555555]">
          <Lightbulb size={15} className="shrink-0 mt-0.5 text-tk-accent" aria-hidden />
          {section.tip}
        </p>
      )}
    </div>
  );
}
