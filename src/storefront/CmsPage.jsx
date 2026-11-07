import React from 'react';
import { useSEO } from '../lib/seo';
import { usePageContent } from '../cms/useSite';
import { SectionList } from '../cms/SectionRenderer';
import { sanitizeHtml } from '../lib/richText';
import NotFoundPage from './NotFoundPage';

/** /pages/:slug — a page made in Admin → Pages: either sections or formatted text (policies, about, contact). */
export default function CmsPage({ slug, onNavigateHome, onNavigateCollection }) {
  const { data: page, isLoading } = usePageContent(slug);

  useSEO(page ? { title: page.seo_title || page.title, description: page.seo_description, image: page.og_image, noindex: !page.is_published } : { title: null });

  if (isLoading) return <div className="min-h-[60vh]" aria-busy="true" />;
  if (!page) return <NotFoundPage onNavigateHome={onNavigateHome} onNavigateCollection={onNavigateCollection} />;

  if (page.layout === 'sections') {
    return (
      <div className="w-full text-tk-ink dark:text-white">
        <SectionList sections={page.sections} />
      </div>
    );
  }

  return (
    <article className="w-full min-h-[70vh] bg-white dark:bg-tk-night text-tk-ink dark:text-white">
      <div className="max-w-3xl mx-auto px-6 sm:px-10 pt-28 sm:pt-32 pb-24">
        {!page.is_published && (
          <p className="mb-6 px-3 py-2 text-[12px] bg-amber-50 text-amber-800 border border-amber-200">Preview: this page is not published yet.</p>
        )}
        <h1 className="text-[30px] sm:text-[40px] font-normal tracking-[-0.015em] mb-8">{page.title}</h1>
        <div
          className="text-[14px] leading-relaxed text-[#444444] dark:text-[#CCCCCC] [&_p]:mb-3 [&_h2]:text-[20px] [&_h2]:text-tk-ink dark:[&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-2 [&_h3]:text-[16px] [&_h3]:mt-5 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:underline [&_a]:text-tk-accent"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.body) }}
        />
      </div>
    </article>
  );
}
