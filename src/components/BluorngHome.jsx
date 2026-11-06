import React from 'react';
import { useSmoothScroll } from './motion/SmoothScrollProvider.jsx';
import BluorngHero from './BluorngHero.jsx';
import BluorngCategories from './BluorngCategories.jsx';
import BluorngFeaturedCollection from './BluorngFeaturedCollection.jsx';
import BluorngCustomExclusive from './BluorngCustomExclusive.jsx';
import BluorngGalleryHero from './BluorngGalleryHero.jsx';
import BluorngSignatureCollection from './BluorngSignatureCollection.jsx';
import BluorngInstagramReels from './BluorngInstagramReels.jsx';
import BluorngFooterAccordions from './BluorngFooterAccordions.jsx';
import LuxuryKineticMarquee from './motion/LuxuryKineticMarquee.jsx';
import AnimatedCampaignBanner from './AnimatedCampaignBanner.jsx';
import BluorngTestimonials from './BluorngTestimonials.jsx';
import BluorngEditorial from './BluorngEditorial.jsx';

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
    <div className="w-full text-[#111111] dark:text-white">
      
      {/* 1. HERO SECTION (Campaign banner & Shop now CTA) - STRICTLY UNTOUCHED */}
      <BluorngHero
        onExploreClick={() => onNavigateCollection('all')}
        onShopDropClick={scrollToLatestDrop}
      />

      {/* 2. ANIMATED LUXURY KINETIC TYPOGRAPHY TICKER */}
      <LuxuryKineticMarquee
        items={[
          'HAUTE PARFUMERIE EXTRAITS',
          'HARVESTED AT DAWN IN GRASSE & ASSAM',
          'PURE HYDRO-DISTILLED BOTANICAL ATTARS',
          '40-YEAR WILD CAMBODI OUD',
          'HAND-CUT MONOGRAMMED FLACONS',
          'ARTISANAL ALCHEMY ON HUMAN SKIN CHEMISTRY'
        ]}
        speed={42}
      />

      {/* 3. CATEGORIES SECTION ("Shop by Category") */}
      <BluorngCategories
        onSelectCategory={onNavigateCollection}
      />

      {/* 4. FEATURED COLLECTION 1 ("Latest drop") */}
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

      {/* 5. ANIMATED EDITORIAL KINETIC TYPOGRAPHY CAMPAIGN BANNER */}
      <AnimatedCampaignBanner
        onExploreCollections={() => onNavigateCollection('all')}
        onExploreAttars={() => onNavigateCollection('royal')}
      />

      {/* 6. CUSTOM EXCLUSIVE SECTION ("Saudagar Discovery Coffrets - Private Vault") */}
      <BluorngCustomExclusive
        activeCurrency={activeCurrency}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onSelectProduct={onSelectProduct}
        onQuickBuy={onQuickBuy}
        onDiscoverMore={() => onNavigateCollection('discovery-sets')}
      />

      {/* 7. GALLERY HERO ("discover collection" - 3 Large Editorial Tiles) */}
      <BluorngGalleryHero
        onSelectCategory={onSelectCategory}
      />

      {/* 8. FEATURED COLLECTION 2 ("Curated Fragrances & Attars") */}
      <BluorngSignatureCollection
        activeCurrency={activeCurrency}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onSelectProduct={onSelectProduct}
        onQuickBuy={onQuickBuy}
        onDiscoverMore={() => onNavigateCollection('all')}
      />

      {/* 9. SECOND ANIMATED LUXURY KINETIC TICKER (Reverse Pace) */}
      <LuxuryKineticMarquee
        items={[
          'TIMELESS SIGNATURE',
          'ROYAL OUD & TAIF ROSES',
          'UNTAMED EXOTIC OBSIDIAN',
          'RIVIERA AZURE & CITRUS BLUES',
          'SUR-MESURE PERFUME ATELIER'
        ]}
        speed={36}
        reverse={true}
      />

      {/* 9a. EDITORIAL STORY (typography statement, bento grid, collection entry points) */}
      <BluorngEditorial onNavigateCollection={onNavigateCollection} />

      {/* 9b. TESTIMONIALS (placeholder content - replace with real reviews) */}
      <BluorngTestimonials />

      {/* 10. INSTAGRAM REELS ("Community & Atelier Reels - Screening Lounge") */}
      <BluorngInstagramReels
        activeCurrency={activeCurrency}
        onSelectProduct={onSelectProduct}
        onQuickBuy={onQuickBuy}
        onOpenStory={onOpenStory}
      />

      {/* 11. COLLAPSIBLE SEO ACCORDION & POPULAR SEARCHES */}
      <BluorngFooterAccordions
        onSelectSearchTerm={(term) => onNavigateCollection(term)}
      />

    </div>
  );
}
