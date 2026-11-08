import React from 'react';
import { useSectionContext } from '../../cms/SectionContext';
import BluorngProductCard from '../../components/BluorngProductCard.jsx';
import BluorngProductReviews from '../../components/BluorngProductReviews.jsx';
import { StaggerContainer, StaggerItem } from '../../components/motion/ScrollReveal.jsx';
import { NotePyramid, AccordBars, ProductAccordions } from '../product/ProductSections.jsx';
import { useSimilarProducts } from '../catalog/hooks';

// Sections that only make sense on the product page or on category/collection pages. They read what the page
// passes in (SectionContext) and render nothing anywhere else.

function SectionHeading({ eyebrow, heading }) {
  if (!eyebrow && !heading) return null;
  return (
    <div className="mb-8">
      {eyebrow && <span className="text-[11px] uppercase tracking-[0.14em] text-tk-accent dark:text-tk-accent-night font-medium">{eyebrow}</span>}
      {heading && <h2 className="text-[22px] sm:text-[26px] font-normal tracking-[-0.015em] text-tk-ink dark:text-white mt-1">{heading}</h2>}
    </div>
  );
}

function ProductGrid({ eyebrow, heading, items, product }) {
  if (!items?.length) return null;
  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 py-16 border-t border-[#EAEAEA] dark:border-white/10 bg-[#FFFFFF] dark:bg-tk-night transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <SectionHeading eyebrow={eyebrow} heading={heading} />
        <StaggerContainer staggerDelay={0.06} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((p) => (
            <StaggerItem key={p.id}>
              <BluorngProductCard
                product={p}
                isWishlisted={(product.wishlist ?? []).includes(p.id)}
                onToggleWishlist={product.onToggleWishlist}
                onSelectProduct={product.onSelectProduct}
                onQuickBuy={() => product.onQuickBuy && product.onQuickBuy(p)}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </div>
  );
}

/** Notes pyramid, accords and the detail accordions of the product. */
export function ProductCompositionSection({ config = {} }) {
  const { product } = useSectionContext();
  if (!product) return null;
  return (
    <div className="w-full bg-[#FFFFFF] dark:bg-tk-night border-t border-[#EAEAEA] dark:border-white/10 px-6 sm:px-10 lg:px-16 py-14 sm:py-16 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        {(config.eyebrow || config.heading) && (
          <div className="mb-6">
            {config.eyebrow && <span className="text-[11px] uppercase tracking-[0.14em] text-[#5F5F5F] dark:text-[#999999]">{config.eyebrow}</span>}
            {config.heading && <h2 className="text-[22px] sm:text-[26px] font-normal tracking-[-0.015em] text-tk-ink dark:text-white mt-1">{config.heading}</h2>}
          </div>
        )}
        {config.show_notes !== false && <NotePyramid notes={product.detail.notes} />}
        {config.show_accords !== false && <AccordBars accords={product.accords} />}
        <ProductAccordions
          detail={product.detail}
          selectedSize={product.selectedSize}
          openAccordion={product.openAccordion}
          onToggle={product.toggleAccordion}
          sampleCopy={product.sampleCopy}
          etaText={product.etaText}
        />
      </div>
    </div>
  );
}

export function ProductReviewsSection() {
  const { product } = useSectionContext();
  if (!product) return null;
  return <BluorngProductReviews productSlug={product.detail.slug} productName={product.name} />;
}

/** "You may also appreciate": the product's hand-picked products, or similar ones found automatically. */
export function ProductSimilarSection({ config = {} }) {
  const { product } = useSectionContext();
  const limit = Math.min(12, Math.max(1, Number(config.limit) || 4));
  const { products } = useSimilarProducts(product?.detail?.slug, limit);
  if (!product) return null;
  return <ProductGrid eyebrow={config.eyebrow} heading={config.heading} items={products} product={product} />;
}

export function ProductRecentSection({ config = {} }) {
  const { product } = useSectionContext();
  if (!product) return null;
  return <ProductGrid eyebrow={config.eyebrow} heading={config.heading} items={product.recentProducts} product={product} />;
}

/** The category or collection's own top picture (or film) and title. */
export function ListingHeaderSection() {
  const { listing } = useSectionContext();
  return listing ? <>{listing.header}</> : null;
}

/** The products of the category or collection, with filters and sorting. */
export function ListingGridSection() {
  const { listing } = useSectionContext();
  return listing ? <>{listing.grid}</> : null;
}
