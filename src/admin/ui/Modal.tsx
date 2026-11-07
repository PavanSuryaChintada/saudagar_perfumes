import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/40" />
        <Dialog.Content
          className={`fixed z-[81] inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full ${
            wide ? 'sm:w-[min(920px,calc(100vw-32px))]' : 'sm:w-[min(560px,calc(100vw-32px))]'
          } max-h-[92svh] flex flex-col bg-white border border-[#EAEAEA] shadow-xl focus:outline-none`}
        >
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#EAEAEA]">
            <div className="min-w-0">
              <Dialog.Title className="text-[15px] font-medium text-tk-ink">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-[12px] text-[#777777]">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="p-1 text-[#777777] hover:text-tk-ink" aria-label="Close">
              <X size={16} />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="px-5 py-3 border-t border-[#EAEAEA] flex justify-end gap-2">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
