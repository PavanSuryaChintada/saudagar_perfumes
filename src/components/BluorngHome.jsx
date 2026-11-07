import React from 'react';
import { CmsSections } from '../cms/SectionRenderer';
import { useBlock, usePageContent } from '../cms/useSite';
import { useSEO, organizationJsonLd } from '../lib/seo';

/** The home page is built entirely from its sections in Admin → Pages → Home. */
export default function BluorngHome() {
  const brand = useBlock('brand') || {};
  const { data: page } = usePageContent('home');
  useSEO({ title: page?.seo_title || null, description: page?.seo_description || null, image: page?.og_image || null, path: '/', jsonLd: organizationJsonLd(brand) });
  return (
    <div className="w-full text-tk-ink dark:text-white">
      <CmsSections slug="home" />
    </div>
  );
}
