// SAUDAGAR PERFUMES - Flagship Collection System
// Single unified luxury color palette across all collections.
// Minimal, timeless, and perfectly cohesive with the rest of the website.

export const UNIFIED_PALETTE = {
  isDark: false,
  pageBg: '#FFFFFF',                  // Luminous clean white canvas
  pageBgGradient: 'none',
  stageBg: '#F8F7F5',                 // Minimal soft pedestal stage
  stageHover: '#F2EFEA',              // Subtle hover tone
  stageBorder: 'transparent',
  stageShadow: 'none',
  accent: '#C4823F',                  // Iconic Saudagar warm amber gold (Light Theme)
  darkAccent: '#ECC86A',              // Champagne Gold (Dark Theme)
  accentHover: '#B57432',
  secondaryAccent: '#DE9954',
  tabUnderline: '#111111',            // Clean minimal black underline
  activePillBg: '#111111',            // Crisp obsidian pill
  activePillText: '#FFFFFF',
  badgeBg: 'rgba(0, 0, 0, 0.05)',
  badgeText: '#666666',
  textPrimary: '#111111',             // Crisp charcoal black
  textSecondary: '#666666',           // Elegant secondary text
  textMuted: '#999999',
  borderSubtle: '#EEEEEE',            // Clean hairline divider
  quickAddBg: '#111111',
  quickAddText: '#FFFFFF',
  quickAddHoverBg: '#C4823F',
  darkQuickAddHoverBg: '#D4AF37'
};

export const COLLECTION_THEMES = {
  // 1. SIGNATURE COLLECTION
  signature: {
    id: 'signature',
    name: 'The Signature Collection',
    shortName: 'Signature',
    slug: 'signature',
    route: '/collections/signature',
    headline: 'TIMELESS LUXURY',
    tagline: 'A DISTINCTIVE EXPRESSION OF PERSONALITY.',
    descriptor: 'An intimate study in proportion, nuance, and quiet authority. Formulated with rare hydro-distilled botanicals, aged Mysore santal, and golden amber resins.',
    notesSubtitle: 'Warm amber resins · Aged Mysore santal · Champagne botanicals',
    colors: UNIFIED_PALETTE,
    hero: {
      video: '/videos/Perfume_bottle_in_luxury_setting_e094f368_1080p.mp4',
      poster: '/images/saudagar_signature_collection_banner_4k.png',
      badge: 'SAUDAGAR SIGNATURE · TIMELESS LUXURY',
      title: 'THE SIGNATURE COLLECTION',
      tagline: 'A DISTINCTIVE EXPRESSION OF PERSONALITY.',
      subtext: 'Artisanal extraits crafted with pure botanical essences, warm champagne resins, and aged Mysore santal.',
      accentTag: 'Timeless Luxury'
    },
    matchingCategories: ['Signature', 'Extrait de Parfum', 'Discovery Sets', 'all', 'new-in', 'bespoke-atelier']
  },

  // 2. ROYAL COLLECTION
  royal: {
    id: 'royal',
    name: 'The Royal Collection',
    shortName: 'Royal',
    slug: 'royal',
    route: '/collections/royal',
    headline: 'HERITAGE & MAJESTY',
    tagline: 'INSPIRED BY HERITAGE. CREATED FOR THE EXTRAORDINARY.',
    descriptor: 'Sacred distillations compounded in the ancestral traditions of Indian royal courts. Ancient Taif damask roses, wild 40-year Assam agarwoods, and Kashmiri saffron distilled for aristocracy.',
    notesSubtitle: 'Taif damask rose · 40-year wild Assam oud · Kashmiri saffron',
    colors: UNIFIED_PALETTE,
    hero: {
      video: '/videos/Ruby_red_perfume_bottle_displayed_4a5d2be2_1080p.mp4',
      poster: '/images/saudagar_imperial_ruby.png',
      badge: 'ROYAL HAUTE PARFUMERIE · TAIF ROSE & ROYAL OUD',
      title: 'THE ROYAL COLLECTION',
      tagline: 'INSPIRED BY HERITAGE. CREATED FOR THE EXTRAORDINARY.',
      subtext: 'Sacred distillations, ancient Taif roses, and rare wild Assam agarwoods compounded for aristocracy.',
      accentTag: 'Heritage & Majesty'
    },
    matchingCategories: ['Royal Attars', 'Oud Royale', 'oud-royale', 'royal-attars', 'Oud & Woods']
  },

  // 3. EXOTIC COLLECTION
  exotic: {
    id: 'exotic',
    name: 'The Exotic Collection',
    shortName: 'Exotic',
    slug: 'exotic',
    route: '/collections/exotic',
    headline: 'UNTAMED NATURE',
    tagline: 'DISCOVER THE EXTRAORDINARY. EMBRACE THE UNTAMED.',
    descriptor: 'Primal, exhilarating expeditions into the world’s most secluded sanctuaries. Deep nocturnal forest canopies, volcanic obsidian smoke, mountain cypress, and raw mineral flint.',
    notesSubtitle: 'Volcanic obsidian · Nocturnal cypress · Rare smoked woods',
    colors: UNIFIED_PALETTE,
    hero: {
      video: '/videos/Perfume_bottle_in_desert_92b81cd7_1080p_gwr_video_mvp.mp4',
      poster: '/images/saudagar_noir_matte.png',
      badge: 'UNTAMED NATURE · DEEP FOREST & VOLCANIC OBSIDIAN',
      title: 'THE EXOTIC COLLECTION',
      tagline: 'DISCOVER THE EXTRAORDINARY. EMBRACE THE UNTAMED.',
      subtext: 'Volcanic earth, crushed pine needles, and primal resinous agarwood from uncharted frontiers.',
      accentTag: 'Untamed Nature'
    },
    matchingCategories: ['Mineral Extrait', 'Obsidian', 'Dark Woods', 'Exotic']
  },

  // 4. FRESH COLLECTION
  fresh: {
    id: 'fresh',
    name: 'The Fresh Collection',
    shortName: 'Fresh',
    slug: 'fresh',
    route: '/collections/fresh',
    headline: 'OCEANIC & AZURE',
    tagline: 'CRISP OCEAN AIR. RADIANT SUNLIT CITRUS.',
    descriptor: 'Sunlit Calabrian bergamot infused with Mediterranean sea spray, crisp ocean salt, saline coastal cedar, and refreshing citrus breezes.',
    notesSubtitle: 'Calabrian bergamot · Saline coastal cedar · Riviera sea spray',
    colors: UNIFIED_PALETTE,
    hero: {
      video: '/videos/Perfume_bottle_on_coastal_landscape_76c07432_1080p.mp4',
      poster: '/images/saudagar_royal_sapphire.png',
      badge: 'AQUATIC & CITRUS · RIVIERA AZURE & SALINE MIST',
      title: 'THE FRESH COLLECTION',
      tagline: 'CRISP OCEAN AIR. RADIANT SUNLIT CITRUS.',
      subtext: 'Sparkling citrus notes, oceanic saline crystals, and comforting sun-bleached coastal woods.',
      accentTag: 'Oceanic & Azure'
    },
    matchingCategories: ['Solar & Aquatic', 'solar-citrus', 'Eau de Parfum Intense', 'Fresh', 'Aquatic']
  }
};

export const PRIMARY_COLLECTIONS_LIST = [
  COLLECTION_THEMES.signature,
  COLLECTION_THEMES.royal,
  COLLECTION_THEMES.exotic,
  COLLECTION_THEMES.fresh
];

/**
 * Resolves any slug, route, or category into one of the 4 flagship collections
 */
export function resolveCollectionTheme(slugOrPath = 'signature') {
  if (!slugOrPath) return COLLECTION_THEMES.signature;

  const normalized = slugOrPath
    .toLowerCase()
    .replace(/^\/collections\//, '')
    .replace(/\/$/, '')
    .trim();

  if (normalized === 'royal' || normalized === 'oud-royale' || normalized === 'royal-attars') {
    return COLLECTION_THEMES.royal;
  }
  if (normalized === 'exotic' || normalized === 'dark' || normalized === 'obsidian' || normalized === 'noir') {
    return COLLECTION_THEMES.exotic;
  }
  if (normalized === 'fresh' || normalized === 'aquatic' || normalized === 'solar-citrus' || normalized === 'solar' || normalized === 'citrus') {
    return COLLECTION_THEMES.fresh;
  }
  // Signature is default for 'signature', 'all', 'new-in', 'discovery-sets', 'bespoke-atelier', etc.
  return COLLECTION_THEMES.signature;
}

/**
 * Filters the product archive for the active collection theme
 */
export function filterProductsByTheme(themeId, allProducts = [], wishlist = []) {
  if (!Array.isArray(allProducts) || allProducts.length === 0) return [];

  if (themeId === 'royal') {
    return allProducts.filter((p) => {
      const name = p.name?.toLowerCase() || '';
      const cat = p.category?.toLowerCase() || '';
      const col = p.collection?.toLowerCase() || '';
      const notes = JSON.stringify(p.notes || {}).toLowerCase();

      return (
        cat.includes('royal') ||
        cat.includes('attar') ||
        name.includes('oud') ||
        name.includes('saffron') ||
        name.includes('taif') ||
        name.includes('ruby') ||
        notes.includes('taif rose') ||
        notes.includes('agarwood') ||
        col.includes('royal')
      );
    });
  }

  if (themeId === 'exotic') {
    return allProducts.filter((p) => {
      const name = p.name?.toLowerCase() || '';
      const cat = p.category?.toLowerCase() || '';
      const notes = JSON.stringify(p.notes || {}).toLowerCase();

      return (
        name.includes('canopy') ||
        name.includes('obsidian') ||
        name.includes('noir') ||
        notes.includes('pine') ||
        notes.includes('cypress') ||
        notes.includes('lichen') ||
        notes.includes('charred') ||
        notes.includes('flint') ||
        notes.includes('volcanic')
      );
    });
  }

  if (themeId === 'fresh') {
    return allProducts.filter((p) => {
      const name = p.name?.toLowerCase() || '';
      const cat = p.category?.toLowerCase() || '';
      const notes = JSON.stringify(p.notes || {}).toLowerCase();

      return (
        cat.includes('solar') ||
        cat.includes('aquatic') ||
        name.includes('pacific') ||
        name.includes('swim') ||
        name.includes('sapphire') ||
        name.includes('ocean') ||
        notes.includes('marine') ||
        notes.includes('bergamot') ||
        notes.includes('sea salt') ||
        notes.includes('lemon') ||
        notes.includes('mint')
      );
    });
  }

  // Signature (Default Timeless Luxury)
  return allProducts.filter((p) => {
    const name = p.name?.toLowerCase() || '';
    const cat = p.category?.toLowerCase() || '';
    const col = p.collection?.toLowerCase() || '';

    return (
      col.includes('signature') ||
      cat.includes('extrait') ||
      cat.includes('discovery') ||
      name.includes('thunderstruck') ||
      name.includes('guidance') ||
      name.includes('amber bark') ||
      name.includes('celestial') ||
      name.includes('coffret') ||
      name.includes('mystic')
    );
  });
}
