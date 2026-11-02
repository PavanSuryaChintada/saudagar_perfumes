// SAUDAGAR PERFUMES - Comprehensive Dynamic Data System
// Blueprint strictly matching https://bluorng.com/ architecture and components

export const CURRENCIES = {
  INR: { code: 'INR', symbol: 'RS. ', rate: 1, label: 'INR (₹)' },
  AED: { code: 'AED', symbol: 'AED ', rate: 0.044, label: 'AED (د.إ)' },
  USD: { code: 'USD', symbol: '$', rate: 0.012, label: 'USD ($)' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.011, label: 'EUR (€)' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.0095, label: 'GBP (£)' }
};

export const NOTIFICATIONS = [
  'BLIND BOX 26 · THE ROYAL OUD DROP IS LIVE NOW',
  'COMPLIMENTARY 10ML DISCOVERY ATOMIZER WITH ORDERS OVER RS. 3,500',
  'FREE WORLDWIDE INSURED COURIER ON ALL ORDERS OVER RS. 4,999'
];

export const MEGA_MENU_COLLECTIONS = [
  {
    id: 'col-new-in',
    title: 'New Arrivals 2026',
    slug: 'new-in',
    image: '/images/saudagar_amber_gold.png',
    count: 12
  },
  {
    id: 'col-oud-royale',
    title: 'Oud Royale Extrait',
    slug: 'oud-royale',
    image: '/images/saudagar_noir_matte.png',
    count: 8
  },
  {
    id: 'col-discovery-sets',
    title: 'Discovery Sets & Coffrets',
    slug: 'discovery-sets',
    image: '/images/saudagar_crystal_diamond.png',
    count: 6
  },
  {
    id: 'col-attars',
    title: 'Pure Royal Attars',
    slug: 'royal-attars',
    image: '/images/saudagar_imperial_ruby.png',
    count: 9
  },
  {
    id: 'col-solar-citrus',
    title: 'Solar & Aquatic Essences',
    slug: 'solar-citrus',
    image: '/images/saudagar_royal_sapphire.png',
    count: 7
  },
  {
    id: 'col-bespoke',
    title: 'Saudagar Atelier Flacons',
    slug: 'bespoke-atelier',
    image: '/images/saudagar_crystal_diamond.png',
    count: 5
  }
];

export const STORY_REELS = [
  {
    id: 'story-1',
    title: 'Oud Royale Drop',
    subtitle: 'Harvested in Assam · Aged for 18 Years',
    image: '/images/saudagar_amber_gold.png',
    videoThumb: '/images/saudagar_amber_gold.png',
    productId: 'saudagar-thunderstruck-oud',
    duration: 5000,
    tag: 'NEW DROP'
  },
  {
    id: 'story-2',
    title: 'Taif Rose Alchemy',
    subtitle: 'Picked at Dawn in the Mountains of Saudi Arabia',
    image: '/images/saudagar_imperial_ruby.png',
    videoThumb: '/images/saudagar_imperial_ruby.png',
    productId: 'saudagar-oud-roses',
    duration: 5000,
    tag: 'BOTANICAL'
  },
  {
    id: 'story-3',
    title: '001 Deep Canopy',
    subtitle: 'Volcanic Flint & Crushed Cypress Needles',
    image: '/images/saudagar_noir_matte.png',
    videoThumb: '/images/saudagar_noir_matte.png',
    productId: 'saudagar-deep-canopy',
    duration: 5000,
    tag: 'SIGNATURE'
  },
  {
    id: 'story-4',
    title: 'The Atelier Flacon',
    subtitle: 'Heavy Crystal Hand-Cut in Val-de-Sambre',
    image: '/images/saudagar_crystal_diamond.png',
    videoThumb: '/images/saudagar_crystal_diamond.png',
    productId: 'saudagar-masterpiece-coffret',
    duration: 5000,
    tag: 'CRAFTSMANSHIP'
  },
  {
    id: 'story-5',
    title: 'Sapphire Sol Marine',
    subtitle: 'Crisp Sea Salt & Sun-Drenched Bergamot',
    image: '/images/saudagar_royal_sapphire.png',
    videoThumb: '/images/saudagar_royal_sapphire.png',
    productId: 'saudagar-pacific-chill',
    duration: 5000,
    tag: 'AQUATIC'
  }
];

export const ALL_PRODUCTS = [
  // LATEST DROPS (Featured Collection 1)
  {
    id: 'saudagar-thunderstruck-oud',
    name: 'Saudagar Thunderstruck Pure Oud Extrait',
    category: 'Extrait de Parfum',
    collection: 'Latest drop',
    price: 5500,
    compareAtPrice: 7200,
    badge: 'NEW DROP',
    rating: 4.9,
    reviewsCount: 184,
    images: [
      '/images/saudagar_amber_gold.png',
      '/images/saudagar_noir_matte.png',
      '/images/saudagar_crystal_diamond.png'
    ],
    sizes: [
      { ml: 50, label: '50ML', price: 5500 },
      { ml: 100, label: '100ML', price: 8900 },
      { ml: 30, label: '30ML EXTRAIT', price: 4200 }
    ],
    notes: {
      top: ['Wild Bergamot', 'Black Pepper', 'Cardamom Pods'],
      heart: ['18-Year Aged Cambodi Oud', 'Taif Rose Petals', 'Smoked Birch'],
      base: ['Dark Ambergris', 'Mysore Sandalwood', 'Charred Leather']
    },
    description: 'A monument of haute parfumerie. Pure, dense Cambodi agarwood smoke pierced by electric flashes of high-altitude bergamot and royal Taif rose petals, anchored in heavy flint and dark ambergris.',
    volume: '50ml / 1.7 FL. OZ.',
    concentration: 'Extrait de Parfum · 38% Pure Fragrance Oil',
    inStock: true
  },
  {
    id: 'saudagar-deep-canopy',
    name: '001 Deep Canopy Mineral Extrait',
    category: 'Extrait de Parfum',
    collection: 'Latest drop',
    price: 6600,
    compareAtPrice: 8000,
    badge: 'BESTSELLER',
    rating: 5.0,
    reviewsCount: 312,
    images: [
      '/images/saudagar_noir_matte.png',
      '/images/saudagar_amber_gold.png',
      '/images/saudagar_royal_sapphire.png'
    ],
    sizes: [
      { ml: 50, label: '50ML', price: 6600 },
      { ml: 100, label: '100ML', price: 10500 },
      { ml: 30, label: '30ML EXTRAIT', price: 4900 }
    ],
    notes: {
      top: ['Crushed Pine Needles', 'Mountain Cypress', 'Cold Rain Accord'],
      heart: ['Wet Green Lichen', 'Galbanum Resin', 'Smoked Vetiver'],
      base: ['Atlas Cedarwood', 'Mineral Flint', 'Dark Ambergris']
    },
    description: 'Mineral density meets structured botanical wood in a composition designed for grounded presence and quiet longevity. Wild mountain cypress, damp lichen, and crushed pine dissolve into cold rain accords.',
    volume: '50ml / 1.7 FL. OZ.',
    concentration: 'Extrait de Parfum · 42% Pure Fragrance Oil',
    inStock: true
  },
  {
    id: 'saudagar-amber-bark',
    name: '002 Amber Bark Solar Resin',
    category: 'Extrait de Parfum',
    collection: 'Latest drop',
    price: 6600,
    compareAtPrice: 7800,
    badge: 'LIMITED',
    rating: 4.9,
    reviewsCount: 289,
    images: [
      '/images/saudagar_amber_gold.png',
      '/images/saudagar_crystal_diamond.png',
      '/images/saudagar_imperial_ruby.png'
    ],
    sizes: [
      { ml: 50, label: '50ML', price: 6600 },
      { ml: 100, label: '100ML', price: 10500 },
      { ml: 30, label: '30ML EXTRAIT', price: 4900 }
    ],
    notes: {
      top: ['Sun-Dried Bergamot', 'Golden Frankincense Tears'],
      heart: ['Raw Amber Resin', 'Cistus Labdanum', 'Wild Honey'],
      base: ['Mysore Sandalwood', 'Smoked Benzoin', 'Cedar Bark']
    },
    description: 'Golden liquid warmth capturing ancient pine resin weeping in summer heat over aged Mysore sandalwood and smoky honeyed benzoin.',
    volume: '50ml / 1.7 FL. OZ.',
    concentration: 'Extrait de Parfum · 40% Pure Fragrance Oil',
    inStock: true
  },
  {
    id: 'saudagar-obsidian-root',
    name: '003 Obsidian Root Dark Agarwood',
    category: 'Extrait de Parfum',
    collection: 'Latest drop',
    price: 6600,
    compareAtPrice: 8500,
    badge: 'HOT',
    rating: 5.0,
    reviewsCount: 420,
    images: [
      '/images/saudagar_noir_matte.png',
      '/images/saudagar_crystal_diamond.png',
      '/images/saudagar_amber_gold.png'
    ],
    sizes: [
      { ml: 50, label: '50ML', price: 6600 },
      { ml: 100, label: '100ML', price: 10500 },
      { ml: 30, label: '30ML EXTRAIT', price: 4900 }
    ],
    notes: {
      top: ['Charred Birch Bark', 'Crushed Black Pepper'],
      heart: ['Java Vetiver Root', 'Smoked Leather Accord', 'Guaiacwood'],
      base: ['Aged Agarwood (Oud)', 'Black Obsidian Mineral', 'Cade Oil']
    },
    description: 'Deep volcanic earth and charred roots infused with aged Cambodi agarwood smoke and dark leather for infinite contemplative sillage.',
    volume: '50ml / 1.7 FL. OZ.',
    concentration: 'Extrait de Parfum · 44% Pure Fragrance Oil',
    inStock: true
  },
  {
    id: 'saudagar-pacific-chill',
    name: 'Saudagar Pacific Coast Aquatic',
    category: 'Eau de Parfum Intense',
    collection: 'Latest drop',
    price: 4999,
    compareAtPrice: 6500,
    badge: 'POPULAR',
    rating: 4.8,
    reviewsCount: 156,
    images: [
      '/images/saudagar_royal_sapphire.png',
      '/images/saudagar_crystal_diamond.png',
      '/images/saudagar_amber_gold.png'
    ],
    sizes: [
      { ml: 50, label: '50ML', price: 4999 },
      { ml: 100, label: '100ML', price: 7999 }
    ],
    notes: {
      top: ['Blackcurrant', 'Californian Lemon', 'Green Mint'],
      heart: ['Carrot Seed', 'Fresh Basil', 'May Rose'],
      base: ['Cedarwood', 'Ambrette Seed', 'White Musk']
    },
    description: 'A radiant energizing fragrance capturing the invigorating vitality of sea salt and coastal winds, with sparkling citrus notes over comforting cedarwood.',
    volume: '50ml / 1.7 FL. OZ.',
    concentration: 'Eau de Parfum Intense · 30% Pure Fragrance Oil',
    inStock: true
  },
  {
    id: 'saudagar-oud-roses',
    name: 'Saudagar Velvet Oud & Taif Roses',
    category: 'Royal Attars',
    collection: 'Latest drop',
    price: 3900,
    compareAtPrice: 5200,
    badge: 'CLASSIC',
    rating: 4.9,
    reviewsCount: 290,
    images: [
      '/images/saudagar_imperial_ruby.png',
      '/images/saudagar_amber_gold.png',
      '/images/saudagar_crystal_diamond.png'
    ],
    sizes: [
      { ml: 50, label: '50ML', price: 3900 },
      { ml: 100, label: '100ML', price: 6200 },
      { ml: 12, label: '12ML PURE ATTAR', price: 2900 }
    ],
    notes: {
      top: ['Taif Rose Petals', 'Saffron Threads', 'Bergamot Peel'],
      heart: ['Smoked Cambodi Oud', 'Spicy Clove', 'Damask Rose Absolute'],
      base: ['White Amber', 'Guaiacwood', 'Golden Honey Musk']
    },
    description: 'A signature Arabian perfume tradition: velvet red roses immersed in smoking Cambodi agarwood and golden spun honey.',
    volume: '50ml / 1.7 FL. OZ.',
    concentration: 'Extrait de Parfum · 35% Pure Fragrance Oil',
    inStock: true
  },
  {
    id: 'saudagar-guidance-46',
    name: 'Saudagar Guidance 46 High Extrait',
    category: 'Extrait de Parfum',
    collection: 'Latest drop',
    price: 5800,
    compareAtPrice: 7500,
    badge: 'LIMITED EDITION',
    rating: 5.0,
    reviewsCount: 318,
    images: [
      '/images/saudagar_imperial_ruby.png',
      '/images/saudagar_royal_sapphire.png',
      '/images/saudagar_amber_gold.png'
    ],
    sizes: [
      { ml: 50, label: '50ML', price: 5800 },
      { ml: 100, label: '100ML', price: 9200 }
    ],
    notes: {
      top: ['Crisp Pear', 'Hazelnut Milk', 'Silver Frankincense'],
      heart: ['Osmanthus', 'Saffron', 'Damask Rose'],
      base: ['Akigalawood', 'Mysore Sandalwood', 'Bourbon Vanilla']
    },
    description: 'An enchanting, hypnotic masterpiece with a lavish 46% concentration. Crisp pear and hazelnut milk dissolve into floral frankincense.',
    volume: '50ml / 1.7 FL. OZ.',
    concentration: 'Extrait de Parfum · 46% Pure Fragrance Oil',
    inStock: true
  },
  {
    id: 'saudagar-afternoon-swim',
    name: 'Saudagar Afternoon Azure Sol',
    category: 'Solar & Aquatic',
    collection: 'Latest drop',
    price: 4600,
    compareAtPrice: 5900,
    badge: 'FRESH',
    rating: 4.8,
    reviewsCount: 140,
    images: [
      '/images/saudagar_royal_sapphire.png',
      '/images/saudagar_amber_gold.png',
      '/images/saudagar_crystal_diamond.png'
    ],
    sizes: [
      { ml: 50, label: '50ML', price: 4600 },
      { ml: 100, label: '100ML', price: 7400 }
    ],
    notes: {
      top: ['Sicilian Mandarin', 'Italian Bergamot'],
      heart: ['Fresh Ginger', 'Orange Blossom'],
      base: ['Grey Ambergris', 'White Musk']
    },
    description: 'A plunge into passion and an ocean of citrus. Ripe Sicilian orange splashed against crisp ginger and ambergris crystal warmth.',
    volume: '50ml / 1.7 FL. OZ.',
    concentration: 'Eau de Parfum Intense · 32% Pure Fragrance Oil',
    inStock: true
  },

  // CUSTOM EXCLUSIVE (Coffrets, Leather Travel, Flacon Sets - 1:1 Aspect Ratio)
  {
    id: 'saudagar-masterpiece-coffret',
    name: 'Saudagar Discovery Coffret (6 x 10ML)',
    category: 'Discovery Sets',
    collection: 'Exclusive Coffrets',
    price: 4500,
    compareAtPrice: 6000,
    badge: 'ICONIC GIFT',
    rating: 5.0,
    reviewsCount: 520,
    images: [
      '/images/saudagar_crystal_diamond.png',
      '/images/saudagar_amber_gold.png',
      '/images/saudagar_imperial_ruby.png'
    ],
    sizes: [
      { ml: 60, label: '6 X 10ML COFFRET', price: 4500 }
    ],
    notes: {
      top: ['Includes Deep Canopy', 'Amber Bark', 'Obsidian Root'],
      heart: ['Thunderstruck Oud', 'Guidance 46', 'Velvet Oud & Roses'],
      base: ['Comes with 24K Gilded Atomizer', 'Presentation Box']
    },
    description: 'The definitive introduction to the House of Saudagar. Six sculptural 10ml flacons housed in a hand-crafted presentation casket with magnetic closure.',
    volume: '6 x 10ml / 2.0 FL. OZ. Total',
    concentration: 'Discovery Set · Pure Extraits',
    inStock: true
  },
  {
    id: 'saudagar-leather-travel-case',
    name: 'Hand-Stitched Italian Leather Flacon Case',
    category: 'Accessories',
    collection: 'Exclusive Coffrets',
    price: 3200,
    compareAtPrice: 4200,
    badge: 'HANDCRAFTED',
    rating: 4.9,
    reviewsCount: 88,
    images: [
      '/images/saudagar_noir_matte.png',
      '/images/saudagar_amber_gold.png',
      '/images/saudagar_crystal_diamond.png'
    ],
    sizes: [
      { ml: 50, label: '50ML CASE', price: 3200 },
      { ml: 100, label: '100ML CASE', price: 3800 }
    ],
    notes: {
      top: ['Full-Grain Italian Calfskin'],
      heart: ['Hand-Waxed Linen Thread'],
      base: ['Embossed 24K Gold Saudagar Insignia']
    },
    description: 'Tailored precisely for the Saudagar 50ml or 100ml flacon. Handcrafted in Florence from vegetable-tanned leather to shield perfume from ultraviolet light.',
    volume: 'Accessory',
    concentration: 'Artisanal Leatherwork',
    inStock: true
  },
  {
    id: 'saudagar-pure-cambodi-flacon',
    name: 'Pure Dehn Al Oud Cambodi Special Reserve',
    category: 'Royal Attars',
    collection: 'Exclusive Coffrets',
    price: 8500,
    compareAtPrice: 11000,
    badge: 'RARE VINTAGE',
    rating: 5.0,
    reviewsCount: 164,
    images: [
      '/images/saudagar_amber_gold.png',
      '/images/saudagar_imperial_ruby.png',
      '/images/saudagar_noir_matte.png'
    ],
    sizes: [
      { ml: 12, label: '1 TOLA (12ML)', price: 8500 },
      { ml: 6, label: '1/2 TOLA (6ML)', price: 4800 }
    ],
    notes: {
      top: ['Sun-cured Agarwood Bark', 'Dried Fig'],
      heart: ['Honeyed Animalic Leather', 'Smoked Vetiver'],
      base: ['Deep Resinous Wood', 'Sweet Tobacco Root']
    },
    description: 'Extracted from wild agarwood trees aged over 40 years in Koh Kong province. Distilled in antique copper stills and aged in dark glass carboys.',
    volume: '12ml Crystal Dip-Rod Bottle',
    concentration: '100% Pure Undiluted Dehn Al Oud',
    inStock: true
  },
  {
    id: 'saudagar-gold-crystal-atomizer',
    name: 'Saudagar 24K Gold Crystal Travel Atomizer',
    category: 'Accessories',
    collection: 'Exclusive Coffrets',
    price: 2400,
    compareAtPrice: 3200,
    badge: 'REFILLABLE',
    rating: 4.8,
    reviewsCount: 115,
    images: [
      '/images/saudagar_crystal_diamond.png',
      '/images/saudagar_royal_sapphire.png',
      '/images/saudagar_amber_gold.png'
    ],
    sizes: [
      { ml: 15, label: '15ML REFILLABLE', price: 2400 }
    ],
    notes: {
      top: ['Aero-Grade Precision Machined Brass'],
      heart: ['24K Micron Gold Plating'],
      base: ['Leak-Proof Borosilicate Glass Ampoule']
    },
    description: 'Engineered for fine mist diffusion. Heavy metal casing with magnetic snap closure and patented anti-leak seal.',
    volume: '15ml Refillable Ampoule',
    concentration: 'Precision Hardware',
    inStock: true
  },

  // SIGNATURE LINE (Featured Collection 2)
  {
    id: 'saudagar-stellar-times',
    name: 'Saudagar Stellar Amber Times',
    category: 'Oriental Amber',
    collection: 'Signature',
    price: 5200,
    compareAtPrice: 6800,
    badge: 'SIGNATURE',
    rating: 4.9,
    reviewsCount: 198,
    images: [
      '/images/saudagar_amber_gold.png',
      '/images/saudagar_crystal_diamond.png',
      '/images/saudagar_royal_sapphire.png'
    ],
    sizes: [
      { ml: 50, label: '50ML', price: 5200 },
      { ml: 100, label: '100ML', price: 8400 }
    ],
    notes: {
      top: ['Orange Blossom', 'Sparkling Neroli'],
      heart: ['Amber Resin', 'Peru Balsam'],
      base: ['Bourbon Vanilla', 'Sandalwood']
    },
    description: 'A sublimely rich, floating voyage through golden palaces of the mind. Amber and oriental sweetness mingle with opulent orange blossoms and warm cedar.',
    volume: '50ml / 1.7 FL. OZ.',
    concentration: 'Extrait de Parfum · 38% Pure Oil',
    inStock: true
  },
  {
    id: 'saudagar-lord-george',
    name: 'Saudagar Lord George Royal Fougere',
    category: 'Aromatic Fougere',
    collection: 'Signature',
    price: 4900,
    compareAtPrice: 6200,
    badge: 'GENTLEMAN',
    rating: 4.8,
    reviewsCount: 172,
    images: [
      '/images/saudagar_noir_matte.png',
      '/images/saudagar_amber_gold.png',
      '/images/saudagar_royal_sapphire.png'
    ],
    sizes: [
      { ml: 50, label: '50ML', price: 4900 },
      { ml: 100, label: '100ML', price: 7900 }
    ],
    notes: {
      top: ['Aged Brandy', 'Barbershop Lavender Accord'],
      heart: ['Toasted Tonka Bean', 'Clary Sage'],
      base: ['Smoked Vetiver', 'Atlas Cedar']
    },
    description: 'A gentleman of pedigree. Warm rum and vintage tobacco leaf laced with shaving soap creaminess and sweet toasted tonka.',
    volume: '50ml / 1.7 FL. OZ.',
    concentration: 'Extrait de Parfum · 34% Pure Oil',
    inStock: true
  },
  {
    id: 'saudagar-enchanted-blooms',
    name: 'Saudagar Enchanted Night Bloom',
    category: 'Floral Oriental',
    collection: 'Signature',
    price: 4800,
    compareAtPrice: 6000,
    badge: 'ALLURING',
    rating: 4.9,
    reviewsCount: 210,
    images: [
      '/images/saudagar_imperial_ruby.png',
      '/images/saudagar_crystal_diamond.png',
      '/images/saudagar_amber_gold.png'
    ],
    sizes: [
      { ml: 50, label: '50ML', price: 4800 },
      { ml: 100, label: '100ML', price: 7800 }
    ],
    notes: {
      top: ['Night-Blooming Tuberose', 'Ylang Ylang'],
      heart: ['Egyptian Jasmine', 'Pink Pepper'],
      base: ['White Sandalwood', 'Creamy Vanilla Pods', 'Clean Musk']
    },
    description: 'Intoxicating white flowers blooming in moonlight. Heavy tuberose and narcotic jasmine draped in soft vanilla velvet.',
    volume: '50ml / 1.7 FL. OZ.',
    concentration: 'Eau de Parfum Intense · 30% Pure Oil',
    inStock: true
  },
  {
    id: 'saudagar-mystic-oud',
    name: 'Saudagar Mystic Smoky Oud',
    category: 'Oud & Woods',
    collection: 'Signature',
    price: 5400,
    compareAtPrice: 7000,
    badge: 'INTENSE',
    rating: 5.0,
    reviewsCount: 276,
    images: [
      '/images/saudagar_noir_matte.png',
      '/images/saudagar_imperial_ruby.png',
      '/images/saudagar_amber_gold.png'
    ],
    sizes: [
      { ml: 50, label: '50ML', price: 5400 },
      { ml: 100, label: '100ML', price: 8700 }
    ],
    notes: {
      top: ['Smoked Incense', 'Pimento Berry'],
      heart: ['Laotian Oud Wood', 'Dry Leather Accord'],
      base: ['Castoreum', 'Styrax Resin', 'Patchouli Root']
    },
    description: 'A sacred incense ritual inside an ancient stone sanctuary. Resins of frankincense and smoldering agarwood evoke timeless majesty.',
    volume: '50ml / 1.7 FL. OZ.',
    concentration: 'Extrait de Parfum · 38% Pure Oil',
    inStock: true
  }
];

// DISCOVER COLLECTION HERO TILES (Section 7 in Bluorng)
export const DISCOVER_GALLERY_TILES = [
  {
    id: 'tile-extraits',
    title: 'Extrait de Parfum',
    mobileTitle: 'Extraits',
    imageDesktop: '/images/saudagar_more_than_fragrance.jpg',
    imageMobile: '/images/saudagar_more_than_fragrance.jpg',
    buttonLabel: 'Shop Now',
    linkCategory: 'Extrait de Parfum'
  },
  {
    id: 'tile-coffrets',
    title: 'Discovery Coffrets',
    mobileTitle: 'Coffrets',
    imageDesktop: '/images/saudagar_flacon_box.jpg',
    imageMobile: '/images/saudagar_flacon_box.png',
    buttonLabel: 'Shop Now',
    linkCategory: 'Discovery Sets'
  },
  {
    id: 'tile-royal-club',
    title: 'Saudagar Royal Club',
    mobileTitle: 'Royal Club',
    imageDesktop: '/images/hero_alcove.jpg',
    imageMobile: '/images/hero_alcove.jpg',
    buttonLabel: 'Shop Now',
    linkCategory: 'Signature'
  }
];

// WALK-IN STORES DATA (Section 9 in Bluorng)
export const BOUTIQUE_STORES = [
  {
    id: 'store-delhi',
    city: 'Delhi (Vasant Kunj)',
    mall: 'Ambience Mall',
    status: 'Open now',
    image: '/images/hero_alcove.jpg',
    address: 'Retail Space UG-19, Upper Ground Floor, Ambience Mall, Vasant Kunj, New Delhi 110070',
    phone: '+91 99589 58313',
    mapUrl: 'https://maps.google.com/?q=Ambience+Mall+Vasant+Kunj+Delhi'
  },
  {
    id: 'store-gurugram',
    city: 'Gurugram (DLF Summit Plaza)',
    mall: 'DLF Summit Plaza',
    status: 'Open now',
    image: '/images/bottom_black_podium.jpg',
    address: 'GC11, Ground Floor, DLF Summit Plaza, DLF Phase 5, Sector 54, Gurugram, Haryana 122009',
    phone: '+91 99589 52988',
    mapUrl: 'https://maps.google.com/?q=DLF+Summit+Plaza+Gurugram'
  },
  {
    id: 'store-mumbai',
    city: 'Mumbai (Bandra West Atelier)',
    mall: 'Waterfield Atelier',
    status: 'Open now',
    image: '/images/bespoke_atelier.jpg',
    address: 'Plot 42, Ground Floor, Waterfield Road, Bandra West, Mumbai, Maharashtra 400050',
    phone: '+91 98200 44211',
    mapUrl: 'https://maps.google.com/?q=Waterfield+Road+Bandra+West+Mumbai'
  },
  {
    id: 'store-bengaluru',
    city: 'Bengaluru (Indiranagar)',
    mall: '100ft Luxury Flagship',
    status: 'Open now',
    image: '/images/brand_story.jpg',
    address: 'Ground Floor, 100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
    phone: '+91 80412 88900',
    mapUrl: 'https://maps.google.com/?q=Indiranagar+100+Feet+Road+Bengaluru'
  },
  {
    id: 'store-dubai',
    city: 'Dubai (Fashion Avenue)',
    mall: 'The Dubai Mall',
    status: 'Open now',
    image: '/images/hero_gold_flacons.jpg',
    address: 'Fashion Avenue Level 1, Unit FA-210, The Dubai Mall, Downtown Dubai, United Arab Emirates',
    phone: '+971 4 362 7500',
    mapUrl: 'https://maps.google.com/?q=The+Dubai+Mall+Fashion+Avenue'
  }
];

// POPULAR SEARCHES TABS DATA FOR FOOTER ACCORDION
export const POPULAR_SEARCHES_TABS = {
  category: [
    { label: 'Extrait de Parfum', query: 'Extrait' },
    { label: 'Pure Dehn Al Oud', query: 'Oud' },
    { label: 'Discovery Sets & Coffrets', query: 'Discovery' },
    { label: 'Royal Concentrated Attars', query: 'Attar' },
    { label: 'Solar & Aquatic Essences', query: 'Aquatic' },
    { label: 'Travel Flacon Leather Cases', query: 'Leather' },
    { label: 'Bespoke Atelier Commissions', query: 'Bespoke' }
  ],
  style: [
    { label: 'Smoky Dark Oud & Leather', query: 'Smoky' },
    { label: 'Sun-Drenched Citrus & Bergamot', query: 'Citrus' },
    { label: 'Opulent Damask Rose & Saffron', query: 'Rose' },
    { label: 'Mineral Earth & Pine Cypress', query: 'Mineral' },
    { label: 'Gourmand Honey & Vanilla Pods', query: 'Gourmand' },
    { label: 'Warm Ambergris & Sandalwood', query: 'Amber' },
    { label: 'Powdery Barber Lavender Fougere', query: 'Fougere' }
  ],
  color: [
    { label: 'Deep Obsidian Black Flacons', query: 'Obsidian' },
    { label: 'Pure 24K Gilded Golden Crystal', query: 'Gold' },
    { label: 'Warm Cognac Amber Glass', query: 'Amber' },
    { label: 'Crystalline Azure Aquatic', query: 'Azure' }
  ]
};

// FORMATTING & STORAGE UTILITIES
export function formatPrice(inrAmount, currencyCode = 'INR') {
  const curr = CURRENCIES[currencyCode] || CURRENCIES.INR;
  const converted = Math.round(inrAmount * curr.rate);
  return `${curr.symbol}${converted.toLocaleString()}`;
}

export function getStoredCurrency() {
  if (typeof window === 'undefined') return 'INR';
  return localStorage.getItem('saudagar_currency') || 'INR';
}

export function setStoredCurrency(code) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('saudagar_currency', code);
  }
}

export function getStoredCart() {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('saudagar_cart_bluorng');
    return data ? JSON.parse(data) : [
      {
        productId: 'saudagar-thunderstruck-oud',
        size: '50ML',
        price: 5500,
        quantity: 1,
        engraving: ''
      }
    ];
  } catch (e) {
    return [];
  }
}

export function setStoredCart(cart) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('saudagar_cart_bluorng', JSON.stringify(cart));
  }
}

export function getStoredWishlist() {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('saudagar_wishlist');
    return data ? JSON.parse(data) : ['saudagar-deep-canopy', 'saudagar-guidance-46'];
  } catch (e) {
    return [];
  }
}

export function setStoredWishlist(list) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('saudagar_wishlist', JSON.stringify(list));
  }
}
