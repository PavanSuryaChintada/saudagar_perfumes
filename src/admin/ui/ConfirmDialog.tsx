import * as Dialog from '@radix-ui/react-dialog';
import { useState, type ReactNode } from 'react';
import { Button } from './Button';

/** The only way the admin asks "are you sure?". Never window.confirm. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  danger,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/40" />
        <Dialog.Content className="fixed z-[91] left-1/2 top-1/2 w-[calc(100vw-32px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 bg-white p-6 border border-[#E2E0DB] shadow-xl focus:outline-none">
          <Dialog.Title className="text-[16px] font-medium text-tk-ink">{title}</Dialog.Title>
          {description && <Dialog.Description className="mt-2 text-[14px] text-[#454545]">{description}</Dialog.Description>}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant={danger ? 'danger' : 'primary'}
              busy={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onConfirm();
                  onOpenChange(false);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
