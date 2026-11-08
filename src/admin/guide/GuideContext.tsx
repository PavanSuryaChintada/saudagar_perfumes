import { createContext, useContext } from 'react';

/** Opens the "How this page works" panel. Provided by the admin layout; absent elsewhere. */
export const GuideContext = createContext<{ openHelp: () => void } | null>(null);

export const useGuidePanel = () => useContext(GuideContext);
