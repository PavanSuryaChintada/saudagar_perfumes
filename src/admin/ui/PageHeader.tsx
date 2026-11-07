import type { ReactNode } from 'react';

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div className="min-w-0">
        <h1 className="text-[22px] font-normal tracking-[-0.01em] text-[#111111]">{title}</h1>
        {description && <p className="mt-1 text-[13px] text-[#666666] max-w-[640px]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, children }: { title?: string; description?: string; children: ReactNode }) {
  return (
    <section className="border border-[#EAEAEA] bg-white">
      {title && (
        <header className="px-4 sm:px-5 py-3.5 border-b border-[#EAEAEA]">
          <h2 className="text-[13px] font-medium text-[#111111]">{title}</h2>
          {description && <p className="mt-0.5 text-[12px] text-[#777777]">{description}</p>}
        </header>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
