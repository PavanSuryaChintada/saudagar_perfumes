import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

export function FieldShell({ label, htmlFor, help, error, children }: { label: string; htmlFor?: string; help?: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[11px] font-medium uppercase tracking-[0.08em] text-[#555555]">
        {label}
      </label>
      {children}
      {error ? <p className="text-[11px] text-rose-600">{error}</p> : help ? <p className="text-[11px] text-[#888888]">{help}</p> : null}
    </div>
  );
}

const inputBase =
  'w-full px-3 py-2 border bg-white text-[13px] text-[#111111] outline-none transition-colors placeholder:text-[#AAAAAA] focus:border-[#111111]';

export function TextInput({ invalid, className = '', ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input {...rest} aria-invalid={invalid || undefined} className={`${inputBase} ${invalid ? 'border-rose-500' : 'border-[#D5D3CC]'} ${className}`} />;
}

export function TextArea({ invalid, className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea {...rest} aria-invalid={invalid || undefined} className={`${inputBase} ${invalid ? 'border-rose-500' : 'border-[#D5D3CC]'} ${className}`} />;
}

export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center border transition-colors ${checked ? 'bg-[#111111] border-[#111111]' : 'bg-[#EAEAEA] border-[#D5D3CC]'}`}
    >
      <span className={`inline-block h-4 w-4 bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}
