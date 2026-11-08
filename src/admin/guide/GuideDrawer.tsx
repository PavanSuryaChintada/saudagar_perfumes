import { Link, useLocation } from 'react-router';
import * as Dialog from '@radix-ui/react-dialog';
import { Compass, X } from 'lucide-react';
import { GUIDE, sectionsFor } from './guide';
import { GuideSteps, StatusPill } from './GuideSteps';
import { useGuideStatus } from './useGuideStatus';

/** Side panel: the guide steps for the page you're on. */
export default function GuideDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { pathname } = useLocation();
  const sections = sectionsFor(pathname);
  const { data: status } = useGuideStatus();
  const close = () => onOpenChange(false);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[85] bg-black/30" />
        <Dialog.Content className="fixed z-[86] inset-y-0 right-0 w-full sm:w-[440px] bg-white border-l border-[#EAEAEA] shadow-xl flex flex-col focus:outline-none">
          <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#EAEAEA]">
            <div>
              <Dialog.Title className="text-[15px] font-medium text-tk-ink">How this page works</Dialog.Title>
              <Dialog.Description className="text-[12px] text-[#777777] mt-0.5">The steps for this part of the store.</Dialog.Description>
            </div>
            <Dialog.Close className="p-1 text-[#777777] hover:text-tk-ink" aria-label="Close">
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-7">
            {sections.length ? (
              sections.map((s) => (
                <section key={s.id} aria-labelledby={`help-${s.id}`} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 id={`help-${s.id}`} className="text-[14px] text-tk-ink">{s.title}</h2>
                    <StatusPill status={s.check ? status?.[s.check] : undefined} optional={s.optional} />
                  </div>
                  <GuideSteps section={s} onNavigate={close} />
                </section>
              ))
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] text-[#555555]">The guide covers the whole store. Pick a topic:</p>
                <ul className="divide-y divide-[#F0F0F0] border border-[#EAEAEA]">
                  {GUIDE.map((s, i) => (
                    <li key={s.id}>
                      <Link to={`/admin/guide?section=${s.id}`} onClick={close} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[13px] hover:bg-[#FAFAF8]">
                        <span>{i + 1}. {s.title}</span>
                        <StatusPill status={s.check ? status?.[s.check] : undefined} optional={s.optional} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="border-t border-[#EAEAEA] px-5 py-3">
            <Link to="/admin/guide" onClick={close} className="inline-flex items-center gap-2 text-[12.5px] text-tk-accent underline underline-offset-4">
              <Compass size={14} aria-hidden /> Open the full guide
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
