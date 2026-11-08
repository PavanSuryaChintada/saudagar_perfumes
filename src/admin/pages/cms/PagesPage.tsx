import { ListHead, ShownPill } from '../../ui/ListHead';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toFriendlyError } from '../../../lib/errors';
import { PageHeader } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { FieldShell, TextInput } from '../../ui/Field';
import { throwIf } from '../../catalog/api';
import { slugify } from '../../catalog/productForm';

export interface PageRow {
  id: string;
  slug: string;
  title: string;
  layout: 'sections' | 'rich_text';
  body: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  is_published: boolean;
  is_system: boolean;
  position: number;
  updated_at: string;
}

export const pageHref = (slug: string) => (slug === 'home' ? '/' : slug === 'story' ? '/story' : `/pages/${slug}`);

export function usePages() {
  return useQuery({
    queryKey: ['admin', 'pages'],
    queryFn: async () => (await throwIf(supabase.from('pages').select('*').order('position').order('title'))) as PageRow[],
  });
}

export default function PagesPage() {
  const { data: pages = [] } = usePages();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<{ title: string; slug: string; layout: 'sections' | 'rich_text' } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!draft) return;
    const title = draft.title.trim();
    const slug = slugify(draft.slug || title);
    if (!title) return setError('Enter a page title.');
    if (!slug) return setError('Enter a link for the page.');
    if (pages.some((p) => p.slug === slug)) return setError('Another page already uses this link.');
    setBusy(true);
    try {
      const row = (await throwIf(
        supabase
          .from('pages')
          .insert({ title, slug, layout: draft.layout, is_published: false, position: pages.length, body: draft.layout === 'rich_text' ? '' : null })
          .select('id')
          .single(),
      )) as { id: string };
      navigate(`/admin/pages/${row.id}`);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Pages"
        description="The home page, the story page, policies and any page you add. Section pages are built from blocks; text pages are one formatted document."
        actions={
          <Button onClick={() => { setError(''); setDraft({ title: '', slug: '', layout: 'rich_text' }); }}>
            <Plus size={14} /> New page
          </Button>
        }
      />
      <div className="bg-white border border-[#E2E0DB] divide-y divide-[#E9E7E2]">
        {pages.length > 0 && (
          <ListHead className="!px-3">
            <span className="flex-1">Page</span>
            <span className="w-[90px]">Status</span>
            <span className="w-[70px] text-right pr-1">Open</span>
          </ListHead>
        )}
        {pages.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
            <Link to={`/admin/pages/${p.id}`} className="min-w-0 flex-1">
              <p className="text-[14px] text-tk-ink truncate hover:underline">{p.title}</p>
              <p className="text-[12px] text-[#4F4F4F] truncate">
                {pageHref(p.slug)} · {p.layout === 'sections' ? 'Sections' : 'Text'}
                {p.is_system ? ' · Built-in' : ''}
              </p>
            </Link>
            <span className="sm:w-[90px]"><ShownPill on={p.is_published} onText="Published" offText="Draft" /></span>
            <a href={pageHref(p.slug)} target="_blank" rel="noreferrer" aria-label={`View ${p.title} on the site`} className="sm:w-[70px] inline-flex items-center justify-end gap-1 px-2 py-1.5 text-[12.5px] text-[#3F3F3F] hover:text-tk-ink">
              <ExternalLink size={13} aria-hidden /> View
            </a>
          </div>
        ))}
      </div>

      <Modal
        open={!!draft}
        onOpenChange={(o) => !o && !busy && setDraft(null)}
        title="New page"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(null)} disabled={busy}>Cancel</Button>
            <Button onClick={create} busy={busy}>Create page</Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            {error && <p className="text-[13px] text-rose-600">{error}</p>}
            <FieldShell label="Title" htmlFor="pg-title">
              <TextInput id="pg-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: slugify(e.target.value) })} />
            </FieldShell>
            <FieldShell label="Link" htmlFor="pg-slug" help={`The page will live at /pages/${draft.slug || 'link'}.`}>
              <TextInput id="pg-slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} />
            </FieldShell>
            <fieldset className="space-y-2">
              <legend className="text-[12px] font-medium text-[#454545]">Kind of page</legend>
              <label className="flex items-start gap-2 text-[14px]">
                <input type="radio" name="pg-layout" checked={draft.layout === 'rich_text'} onChange={() => setDraft({ ...draft, layout: 'rich_text' })} />
                <span>Text page<span className="block text-[12px] text-[#4F4F4F]">One formatted document — policies, about, contact.</span></span>
              </label>
              <label className="flex items-start gap-2 text-[14px]">
                <input type="radio" name="pg-layout" checked={draft.layout === 'sections'} onChange={() => setDraft({ ...draft, layout: 'sections' })} />
                <span>Section page<span className="block text-[12px] text-[#4F4F4F]">Built from the same sections as the home page.</span></span>
              </label>
            </fieldset>
          </div>
        )}
      </Modal>
    </div>
  );
}
