import { useEffect, useState } from 'react';
import { useBlock } from '../../cms/useSite';
import { fullTitle, lengthAdvice } from '../../lib/searchListing';
import { FieldShell, TextArea, TextInput } from './Field';

export interface ListingWords {
  title: string;
  description: string;
}

const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/**
 * “How this shows on Google”: a preview of the search result, written automatically from the page. The admin can
 * keep it (recommended: it updates when the page changes) or write their own words, with a plain length guide.
 * Empty values mean automatic.
 */
export function SearchListing({ value, onChange, suggestion, path }: { value: ListingWords; onChange: (next: ListingWords) => void; suggestion: ListingWords; path: string }) {
  const brand = useBlock<Record<string, string>>('brand');
  const siteName = brand?.name || 'Saudagar Perfumers';
  const custom = !!(value.title.trim() || value.description.trim());
  const [own, setOwn] = useState(custom);
  useEffect(() => {
    if (custom) setOwn(true);
  }, [custom]);
  const shownTitle = fullTitle((own && value.title.trim()) || suggestion.title, siteName);
  const shownDesc = (own && value.description.trim()) || suggestion.description;
  const host = typeof window !== 'undefined' ? window.location.host : '';
  const crumbs = path.split('/').filter(Boolean);
  const titleTip = lengthAdvice('title', fullTitle(value.title || suggestion.title, siteName));
  const descTip = lengthAdvice('description', value.description || suggestion.description);

  return (
    <div className="space-y-4">
      <p className="text-[13.5px] text-[#3F3F3F]">
        This is how the page appears when someone finds it on Google. It is written for you from the page itself and stays up to date when you change the page.
      </p>
      <div className="border border-[#DADCE0] bg-white px-4 py-3 max-w-[640px]" aria-label="Google result preview">
        <p className="text-[12.5px] text-[#202124] truncate">
          {siteName} <span className="text-[#4D5156]">› {[host, ...crumbs].join(' › ')}</span>
        </p>
        <p className="text-[19px] leading-snug text-[#1A0DAB] mt-0.5">{cut(shownTitle, 64)}</p>
        <p className="text-[13.5px] leading-relaxed text-[#4D5156] mt-0.5">{cut(shownDesc, 165)}</p>
      </div>
      <div role="radiogroup" aria-label="Google words" className="space-y-2">
        <label className="flex items-start gap-2 text-[14px] cursor-pointer">
          <input
            type="radio"
            name={`seo-${path}`}
            checked={!own}
            onChange={() => {
              setOwn(false);
              onChange({ title: '', description: '' });
            }}
            className="mt-1"
          />
          <span>
            Automatic, from the page <span className="text-[12.5px] text-emerald-800 font-medium">(recommended)</span>
            <span className="block text-[12.5px] text-[#4F4F4F]">Nothing to do. The words above follow the page’s name, description and details.</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-[14px] cursor-pointer">
          <input
            type="radio"
            name={`seo-${path}`}
            checked={own}
            onChange={() => {
              setOwn(true);
              if (!custom) onChange({ title: suggestion.title, description: suggestion.description });
            }}
            className="mt-1"
          />
          <span>
            Write my own words
            <span className="block text-[12.5px] text-[#4F4F4F]">Starts from the automatic words so you only change what you want.</span>
          </span>
        </label>
      </div>
      {own && (
        <div className="space-y-3">
          <FieldShell label="Title on Google" htmlFor={`seo-t-${path}`} help={`“ | ${siteName}” is added at the end.`}>
            <TextInput id={`seo-t-${path}`} value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} />
            <p className={`mt-1 text-[12.5px] ${titleTip.ok ? 'text-emerald-800' : 'text-rose-700'}`}>{titleTip.text}</p>
          </FieldShell>
          <FieldShell label="Description on Google" htmlFor={`seo-d-${path}`}>
            <TextArea id={`seo-d-${path}`} rows={3} value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} />
            <p className={`mt-1 text-[12.5px] ${descTip.ok ? 'text-emerald-800' : 'text-rose-700'}`}>{descTip.text}</p>
          </FieldShell>
        </div>
      )}
    </div>
  );
}
