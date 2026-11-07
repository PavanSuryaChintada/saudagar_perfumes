import React from 'react';
import { CmsSections } from '../cms/SectionRenderer';

/** The home page is built entirely from its sections in Admin → Pages → Home. */
export default function BluorngHome() {
  return (
    <div className="w-full text-tk-ink dark:text-white">
      <CmsSections slug="home" />
    </div>
  );
}
