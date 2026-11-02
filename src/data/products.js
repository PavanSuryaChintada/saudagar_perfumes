export const CURRENCIES = {
  AED: { code: 'AED', symbol: 'AED ', rate: 1, label: 'AED (د.إ)' },
  USD: { code: 'USD', symbol: '$', rate: 0.27, label: 'USD ($)' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.25, label: 'EUR (€)' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.22, label: 'GBP (£)' },
  INR: { code: 'INR', symbol: '₹', rate: 22.8, label: 'INR (₹)' }
};

export const PRODUCTS = [
  // --- SERIES I: THE ESSENCES (NEW BARE / EDITORIAL TRIO) ---
  {
    id: 'saudagar-deep-canopy',
    name: '001 DEEP CANOPY',
    seriesNumber: '001',
    collection: 'Series I: The Essences',
    concentration: 'Extrait de Parfum · 38% Pure Botanical Essence',
    subheading: 'Mineral Density, Forest Cypress & Wet Moss',
    description: 'Mineral density meets structured wood in a composition designed for grounded presence and quiet longevity. Wild mountain cypress, damp lichen, and crushed pine needles dissolve into cold rain accords and ancient cedarwood.',
    family: 'Earthy Mineral Wood',
    image: '/images/saudagar_amber_gold.png',
    secondaryImage: '/images/saudagar_royal_sapphire.png',
    prices: { AED: 80, USD: 80, EUR: 75, GBP: 65, INR: 6600 },
    rating: 5.0,
    reviewsCount: 312,
    isWeeklyPick: true,
    isBestseller: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Crushed Pine Needles', 'Mountain Cypress', 'Cold Rain Accord'],
      heart: ['Wet Green Lichen', 'Galbanum Resin', 'Smoked Vetiver'],
      base: ['Atlas Cedarwood', 'Mineral Flint', 'Dark Ambergris']
    }
  },
  {
    id: 'saudagar-amber-bark',
    name: '002 AMBER BARK',
    seriesNumber: '002',
    collection: 'Series I: The Essences',
    concentration: 'Extrait de Parfum · 42% Pure Botanical Essence',
    subheading: 'Sun-Cured Sap, Raw Resin & Aged Sandalwood',
    description: 'Mineral density meets structured wood in a composition designed for grounded presence and quiet longevity. Golden liquid warmth capturing ancient pine resin weeping in summer heat over aged Mysore sandalwood and smoky honeyed benzoin.',
    family: 'Solar Resin & Amber Wood',
    image: '/images/saudagar_royal_sapphire.png',
    secondaryImage: '/images/saudagar_imperial_ruby.png',
    prices: { AED: 80, USD: 80, EUR: 75, GBP: 65, INR: 6600 },
    rating: 4.9,
    reviewsCount: 289,
    isWeeklyPick: true,
    isBestseller: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Sun-Dried Bergamot', 'Golden Frankincense Tears'],
      heart: ['Raw Amber Resin', 'Cistus Labdanum', 'Wild Honey'],
      base: ['Mysore Sandalwood', 'Smoked Benzoin', 'Cedar Bark']
    }
  },
  {
    id: 'saudagar-obsidian-root',
    name: '003 OBSIDIAN ROOT',
    seriesNumber: '003',
    collection: 'Series I: The Essences',
    concentration: 'Extrait de Parfum · 40% Pure Botanical Essence',
    subheading: 'Charred Vetiver, Smoked Cedar & Dark Agarwood',
    description: 'Mineral density meets structured wood in a composition designed for grounded presence and quiet longevity. Deep volcanic earth and charred roots infused with aged Cambodi agarwood smoke and dark leather for infinite contemplative sillage.',
    family: 'Smoky Dark Oud & Vetiver',
    image: '/images/saudagar_imperial_ruby.png',
    secondaryImage: '/images/saudagar_crystal_diamond.png',
    prices: { AED: 80, USD: 80, EUR: 75, GBP: 65, INR: 6600 },
    rating: 5.0,
    reviewsCount: 420,
    isWeeklyPick: true,
    isBestseller: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Charred Birch Bark', 'Crushed Black Pepper'],
      heart: ['Java Vetiver Root', 'Smoked Leather Accord', 'Guaiacwood'],
      base: ['Aged Agarwood (Oud)', 'Black Obsidian Mineral', 'Cade Oil']
    }
  },

  // --- FRAGRANCE OF THE WEEK ---
  {
    id: 'saudagar-pacific-chill',
    name: 'SAUDAGAR PACIFIC CHILL',
    inspiration: 'Inspired by Louis Vuitton',
    collection: 'Brand Inspirations',
    concentration: 'Extrait de Parfum · 35% Pure Oil',
    subheading: 'Blackcurrant, Carrot Seed & Mediterranean Mint',
    description: 'A radiant energizing fragrance capturing the invigorating vitality of the Pacific coast. Crisp notes of fresh blackcurrant, citrus lemon, and coriander breeze softly over soothing basil and apricot.',
    family: 'Fresh Citrus & Aquatic',
    image: '/images/saudagar_crystal_diamond.png',
    secondaryImage: '/images/saudagar_noir_matte.png',
    prices: { AED: 100, USD: 28, EUR: 26, GBP: 22, INR: 2280 },
    rating: 4.9,
    reviewsCount: 184,
    isWeeklyPick: true,
    isBestseller: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Blackcurrant', 'Californian Lemon', 'Green Mint'],
      heart: ['Carrot Seed', 'Fresh Basil', 'May Rose'],
      base: ['Cedarwood', 'Ambrette Seed', 'White Musk']
    }
  },
  {
    id: 'saudagar-guidance-46',
    name: 'SAUDAGAR GUIDANCE 46',
    inspiration: 'Inspired by Amouage',
    collection: 'Brand Inspirations',
    concentration: 'Extrait de Parfum · 46% Pure Oil',
    subheading: 'Pear, Frankincense & Almond Milk Extrait',
    description: 'An enchanting, hypnotic masterpiece with a lavish 46% concentration. Crisp pear and hazelnut dissolve into floral frankincense, saffron, and rich akigalawood for monumental longevity.',
    family: 'Amber Floral Gourmand',
    image: '/images/saudagar_noir_matte.png',
    secondaryImage: '/images/saudagar_amber_gold.png',
    prices: { AED: 140, USD: 39, EUR: 36, GBP: 31, INR: 3190 },
    rating: 5.0,
    reviewsCount: 246,
    isWeeklyPick: true,
    isBestseller: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Crisp Pear', 'Hazelnut', 'Frankincense'],
      heart: ['Osmanthus', 'Saffron', 'Damask Rose'],
      base: ['Akigalawood', 'Sandalwood', 'Vanilla Bourbon']
    }
  },
  {
    id: 'saudagar-afternoon-swim',
    name: 'SAUDAGAR AFTERNOON SWIM',
    inspiration: 'Inspired by Louis Vuitton',
    collection: 'Brand Inspirations',
    concentration: 'Extrait de Parfum · 32% Pure Oil',
    subheading: 'Sun-drenched Mandarin, Bergamot & Ginger',
    description: 'A plunge into passion and an ocean of citrus. Ripe Sicilian orange and sunny bergamot splashed against crisp ginger and ambergris crystal warmth.',
    family: 'Solar Citrus Cocktail',
    image: '/images/saudagar_amber_gold.png',
    secondaryImage: '/images/saudagar_royal_sapphire.png',
    prices: { AED: 120, USD: 33, EUR: 31, GBP: 27, INR: 2730 },
    rating: 4.8,
    reviewsCount: 142,
    isWeeklyPick: true,
    isBestseller: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Sicilian Mandarin', 'Italian Bergamot'],
      heart: ['Fresh Ginger', 'Orange Blossom'],
      base: ['Grey Ambergris', 'White Musk']
    }
  },
  {
    id: 'saudagar-stellar-times',
    name: 'SAUDAGAR STELLAR TIMES',
    inspiration: 'Inspired by Louis Vuitton',
    collection: 'Brand Inspirations',
    concentration: 'Extrait de Parfum · 38% Pure Oil',
    subheading: 'Golden Amber, Orange Blossom & Vanilla',
    description: 'A sublimely rich, floating voyage through golden palaces of the mind. Amber and oriental sweetness mingle with opulent orange blossoms and warm cedar.',
    family: 'Oriental Amber',
    image: '/images/saudagar_royal_sapphire.png',
    secondaryImage: '/images/saudagar_imperial_ruby.png',
    prices: { AED: 140, USD: 39, EUR: 36, GBP: 31, INR: 3190 },
    rating: 4.9,
    reviewsCount: 98,
    isWeeklyPick: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Orange Blossom', 'Sparkling Neroli'],
      heart: ['Amber Resin', 'Peru Balsam'],
      base: ['Bourbon Vanilla', 'Sandalwood']
    }
  },
  {
    id: 'saudagar-oud-roses',
    name: 'SAUDAGAR OUD & ROSES',
    inspiration: 'Inspired by Ahmed Al Maghribi',
    collection: 'Brand Inspirations',
    concentration: 'Eau de Parfum Intense',
    subheading: 'Taif Rose Petals & Smoked Agarwood',
    description: 'A signature Arabian perfume tradition: velvet red roses immersed in smoking Cambodi agarwood and golden spun honey.',
    family: 'Arabian Rose Oud',
    image: '/images/saudagar_imperial_ruby.png',
    secondaryImage: '/images/saudagar_crystal_diamond.png',
    prices: { AED: 50, USD: 14, EUR: 13, GBP: 11, INR: 1140 },
    rating: 4.7,
    reviewsCount: 310,
    isWeeklyPick: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Taif Rose', 'Lavender', 'Citrus Peel'],
      heart: ['Smoked Agarwood', 'Spicy Clove'],
      base: ['White Amber', 'Guaiac Wood', 'Musk']
    }
  },
  {
    id: 'saudagar-lord-george',
    name: 'SAUDAGAR LORD GEORGE',
    inspiration: "Inspired by Penhaligon's",
    collection: 'Brand Inspirations',
    concentration: 'Extrait de Parfum · 32% Oil',
    subheading: 'Shaving Soap, Warm Rum & Tonka Bean',
    description: 'A gentleman of distinguished pedigree. Warm rum and vintage tobacco leaf laced with shaving soap creaminess and sweet toasted tonka.',
    family: 'Aromatic Fougere Woody',
    image: '/images/saudagar_crystal_diamond.png',
    secondaryImage: '/images/saudagar_noir_matte.png',
    prices: { AED: 100, USD: 28, EUR: 26, GBP: 22, INR: 2280 },
    rating: 4.8,
    reviewsCount: 165,
    isWeeklyPick: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Brandy', 'Barber Soap Accord'],
      heart: ['Tonka Bean', 'Clary Sage'],
      base: ['Smoked Vetiver', 'Cedarwood']
    }
  },

  // --- SIP AND SCENT (NEW LAUNCH) ---
  {
    id: 'pina-colada',
    name: 'PINA COLADA',
    collection: 'Sip and Scent',
    concentration: 'Eau de Parfum',
    subheading: 'Pineapple Nectar, Fresh Coconut & White Rum',
    description: 'An intoxicating seaside elixir of crushed sweet pineapple, fresh creamy coconut water, and a dash of cane sugar with gentle warm vanilla.',
    family: 'Tropical Gourmand',
    image: '/images/saudagar_noir_matte.png',
    secondaryImage: '/images/saudagar_amber_gold.png',
    prices: { AED: 120, USD: 33, EUR: 31, GBP: 27, INR: 2730 },
    rating: 4.9,
    reviewsCount: 78,
    isNewLaunch: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Golden Pineapple', 'Key Lime'],
      heart: ['Coconut Milk', 'White Rum'],
      base: ['Vanilla Pod', 'Solar Musk']
    }
  },
  {
    id: 'coco-freeze',
    name: 'COCO FREEZE',
    collection: 'Sip and Scent',
    concentration: 'Eau de Parfum',
    subheading: 'Iced Coconut, Peppermint & Minty Bamboo',
    description: 'Crisp, frosty refreshment. Chilled young coconut blended with crystalline menthol, crushed mint leaves, and a clean aquatic finish.',
    family: 'Iced Aquatic Gourmand',
    image: '/images/saudagar_amber_gold.png',
    secondaryImage: '/images/saudagar_royal_sapphire.png',
    prices: { AED: 120, USD: 33, EUR: 31, GBP: 27, INR: 2730 },
    rating: 4.8,
    reviewsCount: 65,
    isNewLaunch: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Frosted Mint', 'Lemon Zest'],
      heart: ['Coconut Water', 'Bamboo Grass'],
      base: ['Iced Amber', 'Cashmeran']
    }
  },
  {
    id: 'blood-orange-spritz',
    name: 'BLOOD ORANGE SPRITZ',
    collection: 'Sip and Scent',
    concentration: 'Eau de Parfum',
    subheading: 'Ruby Orange, Prosecco Bubbles & Amber Herb',
    description: 'Effervescent and uplifting. Bittersweet ruby blood orange soaked in sparkling prosecco accords with Italian herbs and sun-drenched amber.',
    family: 'Sparkling Citrus Cocktail',
    image: '/images/saudagar_royal_sapphire.png',
    secondaryImage: '/images/saudagar_imperial_ruby.png',
    prices: { AED: 120, USD: 33, EUR: 31, GBP: 27, INR: 2730 },
    rating: 5.0,
    reviewsCount: 92,
    isNewLaunch: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Blood Orange', 'Campari Accord'],
      heart: ['Sparkling Prosecco', 'Grapefruit'],
      base: ['Golden Amber', 'Vetiver']
    }
  },
  {
    id: 'chocolate-martini',
    name: 'CHOCOLATE MARTINI',
    collection: 'Sip and Scent',
    concentration: 'Eau de Parfum',
    subheading: 'Dark Belgian Cocoa, Roasted Espresso & Vanilla Cream',
    description: 'Decadence poured into a flacon. Velvety roasted cocoa beans shaken with creamy espresso liqueur, melted caramel, and soft sandalwood.',
    family: 'Rich Dark Gourmand',
    image: '/images/saudagar_imperial_ruby.png',
    secondaryImage: '/images/saudagar_crystal_diamond.png',
    prices: { AED: 120, USD: 33, EUR: 31, GBP: 27, INR: 2730 },
    rating: 4.9,
    reviewsCount: 84,
    isNewLaunch: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Dark Cocoa', 'Coffee Liqueur'],
      heart: ['Caramel Cream', 'Nutmeg'],
      base: ['Vanilla Bean', 'Indonesian Sandalwood']
    }
  },

  // --- BRAND INSPIRATIONS (PERFUMES) ---
  {
    id: 'saudagar-imagination',
    name: 'SAUDAGAR IMAGINATION',
    inspiration: 'Inspired by Louis Vuitton',
    collection: 'Brand Inspirations',
    concentration: 'Extrait de Parfum · 32% Oil',
    subheading: 'Black Tea, Sicilian Citron & Ambroxan Spark',
    description: 'An exceptional interpretation of timeless luxury. Sparkling Calabrian bergamot infused with rare Chinese black tea and warm glowing ambroxan.',
    family: 'Citrus Aromatic Tea',
    image: '/images/saudagar_crystal_diamond.png',
    secondaryImage: '/images/saudagar_noir_matte.png',
    prices: { AED: 120, USD: 33, EUR: 31, GBP: 27, INR: 2730 },
    rating: 5.0,
    reviewsCount: 380,
    isBestseller: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Calabrian Bergamot', 'Citron', 'Sicilian Orange'],
      heart: ['Nigerian Ginger', 'Ceylon Cinnamon', 'Neroli'],
      base: ['Chinese Black Tea', 'Ambroxan', 'Guaiac Wood']
    }
  },
  {
    id: 'saudagar-sauvage',
    name: 'SAUDAGAR SAUVAGE',
    inspiration: 'Inspired by Dior',
    collection: 'Brand Inspirations',
    concentration: 'Eau de Parfum Intense',
    subheading: 'Sichuan Pepper, Bergamot & Raw Ambergris',
    description: 'Raw, noble, and deeply magnetic. A blast of Reggio bergamot sustained by Sichuan pepper and the intense woody trail of pure ambergris.',
    family: 'Fresh Spicy Aromatic',
    image: '/images/saudagar_noir_matte.png',
    secondaryImage: '/images/saudagar_amber_gold.png',
    prices: { AED: 50, USD: 14, EUR: 13, GBP: 11, INR: 1140 },
    rating: 4.8,
    reviewsCount: 520,
    isBestseller: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Calabrian Bergamot', 'Pepper'],
      heart: ['Sichuan Pepper', 'Lavender', 'Pink Pepper'],
      base: ['Ambroxan', 'Cedar', 'Labdanum']
    }
  },
  {
    id: 'saudagar-baccarat-rouge-540',
    name: 'SAUDAGAR BACCARAT ROUGE 540',
    inspiration: 'Inspired by MFK',
    collection: 'Brand Inspirations',
    concentration: 'Extrait de Parfum · 35% Oil',
    subheading: 'Jasmine, Saffron, Amberwood & Fir Resin',
    description: 'Luminous and airy on the skin yet infinitely present. Wild ambergris and freshly cut cedar embrace delicate saffron and Egyptian jasmine petals.',
    family: 'Amber Floral Woody',
    image: '/images/saudagar_amber_gold.png',
    secondaryImage: '/images/saudagar_royal_sapphire.png',
    prices: { AED: 100, USD: 28, EUR: 26, GBP: 22, INR: 2280 },
    rating: 4.9,
    reviewsCount: 460,
    isBestseller: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Kashmiri Saffron', 'Egyptian Jasmine'],
      heart: ['Amberwood', 'Ambergris Accord'],
      base: ['Fir Resin', 'Cedarwood']
    }
  },
  {
    id: 'saudagar-bleu-de',
    name: 'SAUDAGAR BLEU DE',
    inspiration: 'Inspired by Chanel',
    collection: 'Brand Inspirations',
    concentration: 'Eau de Parfum Intense',
    subheading: 'Pink Pepper, Grapefruit & Dry Incense',
    description: 'A tribute to masculine freedom. A crisp citrus-woody harmony with notes of aromatic cedar and velvety ambergris enveloped by incense.',
    family: 'Woody Aromatic',
    image: '/images/saudagar_royal_sapphire.png',
    secondaryImage: '/images/saudagar_imperial_ruby.png',
    prices: { AED: 50, USD: 14, EUR: 13, GBP: 11, INR: 1140 },
    rating: 4.7,
    reviewsCount: 290,
    isBestseller: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Grapefruit', 'Lemon', 'Mint'],
      heart: ['Ginger', 'Nutmeg', 'Jasmine'],
      base: ['Incense', 'Vetiver', 'Cedar']
    }
  },
  {
    id: 'saudagar-ombre-leather',
    name: 'SAUDAGAR OMBRE LEATHER',
    inspiration: 'Inspired by Tom Ford',
    collection: 'Brand Inspirations',
    concentration: 'Extrait de Parfum · 30% Oil',
    subheading: 'Black Leather, Cardamom & Patchouli',
    description: 'Vast and unconstrained like the desert heart. Supple black leather layered with green cardamom and sweet jasmine sambac.',
    family: 'Rich Leather Amber',
    image: '/images/saudagar_imperial_ruby.png',
    secondaryImage: '/images/saudagar_crystal_diamond.png',
    prices: { AED: 70, USD: 19, EUR: 18, GBP: 15, INR: 1590 },
    rating: 4.9,
    reviewsCount: 310,
    isBestseller: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Cardamom', 'Saffron'],
      heart: ['Tuscan Leather', 'Jasmine Sambac'],
      base: ['White Moss', 'Patchouli', 'Amber']
    }
  },
  {
    id: 'saudagar-oud-wood',
    name: 'SAUDAGAR OUD WOOD',
    inspiration: 'Inspired by Tom Ford',
    collection: 'Brand Inspirations',
    concentration: 'Extrait de Parfum · 32% Oil',
    subheading: 'Smoky Oud, Rosewood & Tonka Bean',
    description: 'One of the most rare, precious ingredients in perfume history. Rosewood and cardamom deliver a smoky blend of rare oud wood, sandalwood, and vetiver.',
    family: 'Precious Woody Oud',
    image: '/images/saudagar_crystal_diamond.png',
    secondaryImage: '/images/saudagar_noir_matte.png',
    prices: { AED: 70, USD: 19, EUR: 18, GBP: 15, INR: 1590 },
    rating: 4.8,
    reviewsCount: 275,
    isBestseller: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Rosewood', 'Cardamom', 'Chinese Pepper'],
      heart: ['Oud Wood', 'Sandalwood', 'Vetiver'],
      base: ['Tonka Bean', 'Vanilla', 'Amber']
    }
  },
  {
    id: 'saudagar-ombre-nomade',
    name: 'SAUDAGAR OMBRE NOMADE',
    inspiration: 'Inspired by Louis Vuitton',
    collection: 'Brand Inspirations',
    concentration: 'Extrait de Parfum · 38% Pure Oil',
    subheading: 'Assam Agarwood, Raspberry & Incense Tears',
    description: 'Designed for lovers of rare essences. Swirls of dark oud wood accented with sweet red raspberry and royal benzoin tears.',
    family: 'Oud Oriental Smoked Fruit',
    image: '/images/saudagar_noir_matte.png',
    secondaryImage: '/images/saudagar_amber_gold.png',
    prices: { AED: 100, USD: 28, EUR: 26, GBP: 22, INR: 2280 },
    rating: 5.0,
    reviewsCount: 420,
    isBestseller: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Assam Agarwood', 'Wild Raspberry'],
      heart: ['Incense', 'Rose Absolute', 'Geranium'],
      base: ['Benzoin Tears', 'Amberwood', 'Birch Tar']
    }
  },
  {
    id: 'saudagar-sauvage-elixir',
    name: 'SAUDAGAR SAUVAGE ELIXIR',
    inspiration: 'Inspired by Dior',
    collection: 'Brand Inspirations',
    concentration: 'Extrait de Parfum · 40% Oil',
    subheading: 'Cinnamon, Nutmeg, Lavender & Licorice',
    description: 'An extraordinarily concentrated perfume steeped in legendary freshness with an intoxicating heart of spices and rich woods.',
    family: 'Deep Spicy Woody Fougere',
    image: '/images/saudagar_amber_gold.png',
    secondaryImage: '/images/saudagar_royal_sapphire.png',
    prices: { AED: 70, USD: 19, EUR: 18, GBP: 15, INR: 1590 },
    rating: 4.9,
    reviewsCount: 295,
    isBestseller: true,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Cinnamon', 'Nutmeg', 'Cardamom', 'Grapefruit'],
      heart: ['Aromatic Lavender'],
      base: ['Licorice', 'Sandalwood', 'Amber', 'Patchouli']
    }
  },

  // --- NOBLE COLLECTION (SHOP THE LOOK) ---
  {
    id: 'passio',
    name: 'PASSIO',
    collection: 'Noble Collection',
    concentration: 'Extrait de Parfum · 32% Oil',
    subheading: 'Velvet Passion Fruit, White Gardenia & Cedar',
    description: 'Passion captured in sculptural glass. Radiant passion fruit petals blended with delicate white gardenia and noble Mediterranean cedar.',
    family: 'Luminous Floral Fruity',
    image: '/images/saudagar_royal_sapphire.png',
    secondaryImage: '/images/saudagar_imperial_ruby.png',
    prices: { AED: 120, USD: 33, EUR: 31, GBP: 27, INR: 2730 },
    rating: 4.8,
    reviewsCount: 110,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Passion Fruit', 'Pink Pepper'],
      heart: ['Gardenia', 'Orris'],
      base: ['Cedarwood', 'Crystal Amber']
    }
  },
  {
    id: 'pragma',
    name: 'PRAGMA',
    collection: 'Noble Collection',
    concentration: 'Extrait de Parfum · 34% Oil',
    subheading: 'Golden Saffron, Moroccan Amber & Sandalwood',
    description: 'An ode to enduring elegance. Saffron and Moroccan amber rest peacefully upon a bed of polished sandalwood and warm vanilla.',
    family: 'Noble Amber Wood',
    image: '/images/saudagar_imperial_ruby.png',
    secondaryImage: '/images/saudagar_crystal_diamond.png',
    prices: { AED: 120, USD: 33, EUR: 31, GBP: 27, INR: 2730 },
    rating: 4.9,
    reviewsCount: 95,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Saffron Flower', 'Bergamot'],
      heart: ['Moroccan Amber', 'Myrrh'],
      base: ['Polished Sandalwood', 'Vanilla Resin']
    }
  },
  {
    id: 'devoir-elixer',
    name: 'DEVOIR ELIXIR',
    collection: 'Noble Collection',
    concentration: 'Extrait de Parfum · 36% Oil',
    subheading: 'Black Orchid, Smoky Incense & Royal Musk',
    description: 'Devotion and prestige in harmony. Mysterious black orchids intertwined with sacred frankincense smoke and silky royal skin musks.',
    family: 'Dark Floral Incense',
    image: '/images/saudagar_crystal_diamond.png',
    secondaryImage: '/images/saudagar_noir_matte.png',
    prices: { AED: 120, USD: 33, EUR: 31, GBP: 27, INR: 2730 },
    rating: 4.9,
    reviewsCount: 130,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Black Truffle', 'Ylang Ylang'],
      heart: ['Black Orchid', 'Frankincense Tears'],
      base: ['Patchouli', 'Dark Amber', 'Royal Musk']
    }
  },
  {
    id: 'ardor',
    name: 'ARDOR',
    collection: 'Noble Collection',
    concentration: 'Extrait de Parfum · 35% Oil',
    subheading: 'Warm Cinnamon Bark, Amber Rose & Oud Smoke',
    description: 'The fierce flame of romance. Red cinnamon and fiery spices illuminate velvety damask roses soaked in rich sweet amber smoke.',
    family: 'Spicy Rose Amber',
    image: '/images/saudagar_noir_matte.png',
    secondaryImage: '/images/saudagar_amber_gold.png',
    prices: { AED: 120, USD: 33, EUR: 31, GBP: 27, INR: 2730 },
    rating: 5.0,
    reviewsCount: 145,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Ceylon Cinnamon', 'Pink Pepper'],
      heart: ['Damask Rose', 'Incense Accord'],
      base: ['Sweet Amber', 'Cambodian Oud', 'Vanilla']
    }
  },

  // --- POEM COLLECTION ---
  {
    id: 'poem-for-him',
    name: 'POEM FOR HIM',
    collection: 'Poem Collection',
    concentration: 'Extrait de Parfum · 32% Oil',
    subheading: 'Crushed Cardamom, Vetiver & Royal Leather',
    description: 'Verses composed in scent. A deeply refined masculine blend of green cardamom, smoky Haitian vetiver, and buttery soft calfskin leather.',
    family: 'Aromatic Leather Woody',
    image: '/images/saudagar_amber_gold.png',
    secondaryImage: '/images/saudagar_royal_sapphire.png',
    prices: { AED: 150, USD: 41, EUR: 38, GBP: 33, INR: 3420 },
    rating: 4.9,
    reviewsCount: 88,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['Green Cardamom', 'Bergamot'],
      heart: ['Haitian Vetiver', 'Iris Root'],
      base: ['Fine Leather', 'Ambergris', 'Cedar']
    }
  },
  {
    id: 'poem-for-her',
    name: 'POEM FOR HER',
    collection: 'Poem Collection',
    concentration: 'Extrait de Parfum · 32% Oil',
    subheading: 'Jasmine Sambac, White Peach & Cashmere Woods',
    description: 'Poetic grace and soft allure. Sunlit white peach meets radiant jasmine sambac, draped gently over comforting cashmere woods and white musk.',
    family: 'Ethereal Floral Fruity',
    image: '/images/saudagar_royal_sapphire.png',
    secondaryImage: '/images/saudagar_imperial_ruby.png',
    prices: { AED: 150, USD: 41, EUR: 38, GBP: 33, INR: 3420 },
    rating: 5.0,
    reviewsCount: 112,
    sizes: [
      { ml: 50, label: '50ml Flacon', priceMultiplier: 1 },
      { ml: 100, label: '100ml Flacon', priceMultiplier: 1.6 }
    ],
    notes: {
      top: ['White Peach', 'Mandarin Flower'],
      heart: ['Jasmine Sambac', 'Peony'],
      base: ['Cashmere Woods', 'White Musk', 'Warm Amber']
    }
  }
];

// Helper to format prices according to currency
export function formatPrice(amountInAed, currencyCode = 'AED') {
  const curr = CURRENCIES[currencyCode] || CURRENCIES.AED;
  const converted = Math.round(amountInAed * curr.rate);
  return `${curr.symbol}${converted.toLocaleString()}`;
}

export function getStoredCurrency() {
  if (typeof window === 'undefined') return 'AED';
  return localStorage.getItem('saudagar_currency') || 'AED';
}

export function setStoredCurrency(code) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('saudagar_currency', code);
  }
}

export function getStoredCart() {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('saudagar_cart');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function setStoredCart(cart) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('saudagar_cart', JSON.stringify(cart));
  }
}
