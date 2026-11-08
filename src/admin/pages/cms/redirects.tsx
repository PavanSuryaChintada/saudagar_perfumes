import { Navigate, useParams, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { throwIf } from '../../catalog/api';

// Old addresses of the website screens forward to Admin → Website, so saved links and guide links keep working.

export function PagesRedirect() {
  return <Navigate to="/admin/cms?tab=pages" replace />;
}

export function PageIdRedirect() {
  const { id = '' } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'page-slug', id],
    queryFn: async () => (await throwIf(supabase.from('pages').select('slug').eq('id', id).maybeSingle())) as { slug: string } | null,
  });
  if (isLoading) return <p className="text-[14px] text-[#4A4A4A]">Loading…</p>;
  return <Navigate to={data ? `/admin/cms?tab=pages&page=${encodeURIComponent(data.slug)}` : '/admin/cms?tab=pages'} replace />;
}

export function SiteRedirect() {
  const [params] = useSearchParams();
  const block = params.get('tab');
  return <Navigate to={`/admin/cms?tab=site${block ? `&block=${encodeURIComponent(block)}` : ''}`} replace />;
}

export function ContentRedirect() {
  const { kind = '' } = useParams();
  return <Navigate to={`/admin/cms?tab=content&kind=${encodeURIComponent(kind)}`} replace />;
}
