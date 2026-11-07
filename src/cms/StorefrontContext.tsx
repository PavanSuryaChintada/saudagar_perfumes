import { createContext, useContext, type ReactNode } from 'react';

/** Shop actions sections need (wishlist, quick buy, stories…), provided once by the storefront shell. */
export interface StorefrontActions {
  wishlist: string[];
  onToggleWishlist?: (slug: string) => void;
  onSelectProduct?: (slug: string) => void;
  onQuickBuy?: (product: unknown) => void;
  onOpenStory?: () => void;
  onScrollToStores?: () => void;
  onNavigateCollection?: (slug: string) => void;
}

const Ctx = createContext<StorefrontActions>({ wishlist: [] });

export function StorefrontProvider({ value, children }: { value: StorefrontActions; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStorefront(): StorefrontActions {
  return useContext(Ctx);
}
