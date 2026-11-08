import { useCallback, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useBootstrap } from '../lib/bootstrap';
import { resolveLink, type LinkValue } from './links';
import { useScreenMedia } from './mobileMedia';

/** A site-wide block (brand, header, footer, theme…) from the bootstrap payload. */
export function useBlock<T = Record<string, any>>(key: string): T | undefined {
  const { data } = useBootstrap();
  // Phone or desktop pictures for this screen (see cms/mobileMedia).
  return useScreenMedia((data?.blocks as Record<string, unknown> | undefined)?.[key] as T | undefined);
}

export interface Announcement {
  id: string;
  text: string;
  link: LinkValue | null;
}

export function useAnnouncements(): Announcement[] {
  const { data } = useBootstrap();
  return ((data?.announcements as Announcement[] | undefined) ?? []).filter((a) => a.text);
}

export interface PageContent {
  id: string;
  slug: string;
  title: string;
  layout: 'sections' | 'rich_text';
  body: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  is_published: boolean;
  sections: { id: string; type: string; config: Record<string, any> }[];
}

export function usePageContent(slug: string | undefined) {
  return useQuery({
    queryKey: ['cms', 'page', slug],
    enabled: !!slug,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('page_content', { p_slug: slug! });
      if (error) throw error;
      return (data ?? null) as PageContent | null;
    },
  });
}

/** Follow a CMS link: router navigation for site paths, a new tab for external URLs. */
export function useGo() {
  const navigate = useNavigate();
  return useCallback(
    (link: LinkValue | string | null | undefined) => {
      const r = resolveLink(link);
      if (!r) return;
      if (r.external) window.open(r.href, '_blank', 'noopener,noreferrer');
      else {
        navigate(r.href);
        window.scrollTo(0, 0);
      }
    },
    [navigate],
  );
}

/** Renders a CMS link as a router link or a safe external anchor; plain children when the link is empty. */
export function CmsLink({ link, className, children, onClick }: { link: LinkValue | string | null | undefined; className?: string; children: ReactNode; onClick?: () => void }) {
  const r = resolveLink(link);
  if (!r) return <span className={className}>{children}</span>;
  if (r.external) {
    return (
      <a href={r.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link to={r.href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
