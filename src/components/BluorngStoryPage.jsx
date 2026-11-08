import React from 'react';
import { CmsSections } from '../cms/SectionRenderer';

/** The brand story page; everything on it is edited in Admin → Pages → Story. The site header and footer frame it. */
export default function BluorngStoryPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-tk-night text-tk-ink dark:text-white transition-colors duration-300 font-sans pb-12 select-none">
      <CmsSections slug="story" />
    </div>
  );
}
