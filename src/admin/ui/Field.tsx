import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

export function FieldShell({ label, htmlFor, help, error, children }: { label: string; htmlFor?: string; help?: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13.5px] font-semibold text-[#222222]">
        {label}
      </label>
      {children}
      {error ? <p role="alert" className="text-[13px] font-medium text-rose-700">{error}</p> : help ? <p className="text-[13px] text-[#4F4F4F]">{help}</p> : null}
    </div>
  );
}

const inputBase =
  'w-full px-3 py-2 border bg-white text-[14px] text-tk-ink outline-none transition-colors placeholder:text-[#767676] focus:border-tk-ink';

export function TextInput({ invalid, className = '', ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input {...rest} aria-invalid={invalid || undefined} className={`${inputBase} ${invalid ? 'border-rose-500' : 'border-[#C4C1B9]'} ${className}`} />;
}

export function TextArea({ invalid, className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea {...rest} aria-invalid={invalid || undefined} className={`${inputBase} ${invalid ? 'border-rose-500' : 'border-[#C4C1B9]'} ${className}`} />;
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
      className={`relative inline-flex h-6 w-11 shrink-0 items-center border transition-colors ${checked ? 'bg-tk-ink border-tk-ink' : 'bg-[#D6D2CA] border-[#8F8A82]'}`}
    >
      <span className={`inline-block h-4 w-4 bg-white border transition-transform ${checked ? 'translate-x-6 border-white' : 'translate-x-1 border-[#8F8A82]'}`} />
    </button>
  );
}
