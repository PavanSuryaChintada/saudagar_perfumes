import React from 'react';
import { useSmoothScroll } from './motion/SmoothScrollProvider.jsx';
import BluorngHero from './BluorngHero.jsx';
import BluorngFeaturedCollection from './BluorngFeaturedCollection.jsx';
import BluorngCustomExclusive from './BluorngCustomExclusive.jsx';
import BluorngGalleryHero from './BluorngGalleryHero.jsx';
import BluorngSignatureCollection from './BluorngSignatureCollection.jsx';
import BluorngInstagramReels from './BluorngInstagramReels.jsx';
import BluorngFooterAccordions from './BluorngFooterAccordions.jsx';

export default function BluorngHome({
  activeCurrency,
  wishlist = [],
  onToggleWishlist,
  onSelectProduct,
  onQuickBuy,
  onNavigateCollection,
  onSelectCategory,
  onScrollToStores,
  onOpenStory
}) {
  const { scrollTo } = useSmoothScroll();

  const scrollToLatestDrop = () => {
    scrollTo('#featured-drop-section', { offset: -60 });
  };

  return (
    <div className="w-full bg-[#FFFFFF] text-[#111111]">
      
      {/* 1. HERO SECTION (Campaign banner & Shop now CTA) */}
      <BluorngHero
        onExploreClick={() => onNavigateCollection('all')}
        onShopDropClick={scrollToLatestDrop}
      />

      {/* 2. FEATURED COLLECTION 1 ("Latest drop") */}
      <div id="featured-drop-section">
        <BluorngFeaturedCollection
          activeCurrency={activeCurrency}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          onSelectProduct={onSelectProduct}
          onQuickBuy={onQuickBuy}
          onDiscoverMore={() => onNavigateCollection('new-in')}
        />
      </div>

      {/* 3. CUSTOM EXCLUSIVE SECTION ("Saudagar Discovery Coffrets") */}
      <BluorngCustomExclusive
        activeCurrency={activeCurrency}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onSelectProduct={onSelectProduct}
        onQuickBuy={onQuickBuy}
        onDiscoverMore={() => onNavigateCollection('discovery-sets')}
      />

      {/* 4. GALLERY HERO ("discover collection" - 3 Large Editorial Tiles) */}
      <BluorngGalleryHero
        onSelectCategory={onSelectCategory}
      />

      {/* 5. FEATURED COLLECTION 2 ("Curated Fragrances & Attars") */}
      <BluorngSignatureCollection
        activeCurrency={activeCurrency}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onSelectProduct={onSelectProduct}
        onQuickBuy={onQuickBuy}
        onDiscoverMore={() => onNavigateCollection('all')}
      />

      {/* 6. INSTAGRAM REELS ("Community & Atelier Reels") */}
      <BluorngInstagramReels
        activeCurrency={activeCurrency}
        onSelectProduct={onSelectProduct}
        onQuickBuy={onQuickBuy}
        onOpenStory={onOpenStory}
      />

      {/* 7. COLLAPSIBLE SEO ACCORDION & POPULAR SEARCHES */}
      <BluorngFooterAccordions
        onSelectSearchTerm={(term) => onNavigateCollection(term)}
      />

    </div>
  );
}
