import { createContext, useContext, type ReactNode } from 'react';

/**
 * What a page passes to its CMS sections. The product page passes the product being shown; category and
 * collection pages pass their banner and product grid. Sections that need it render nothing elsewhere.
 */
export interface SectionContextValue {
  product?: Record<string, any>;
  listing?: { header: ReactNode; grid: ReactNode };
}

export const SectionContext = createContext<SectionContextValue>({});

export const useSectionContext = () => useContext(SectionContext);
