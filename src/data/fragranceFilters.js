// SAUDAGAR PERFUMES - Advanced Fragrance Filtering Engine
// Comprehensive categorization for Notes, Occasions, Scent Intensity, Concentration, and Price

export const FILTER_SECTIONS = [
  {
    id: 'intensity',
    title: 'SCENT INTENSITY',
    subtitle: 'Strength & Sillage',
    options: [
      {
        id: 'beastmode',
        label: 'Extrait / Beastmode Royal',
        badge: '38–46%',
        desc: 'Room-filling sillage, 14+ hours longevity'
      },
      {
        id: 'intense',
        label: 'Intense / Bold Sillage',
        badge: 'Potent',
        desc: 'Commanding presence with a distinct scent trail'
      },
      {
        id: 'moderate',
        label: 'Moderate / Radiant Aura',
        badge: 'Balanced',
        desc: 'Arms-length projection, 6–8 hours longevity'
      },
      {
        id: 'soft',
        label: 'Soft / Intimate Whisper',
        badge: 'Discreet',
        desc: 'Close-to-skin delicacy, subtle & quiet elegance'
      }
    ]
  },
  {
    id: 'notes',
    title: 'OLFACTORY NOTES',
    subtitle: 'Signature accords & botanicals',
    options: [
      { id: 'oud', label: 'Oud & Rare Agarwood', keywords: ['oud', 'agarwood', 'cambodi', 'assam'] },
      { id: 'rose', label: 'Taif Rose & Florals', keywords: ['rose', 'taif', 'jasmine', 'tuberose', 'damask', 'damascena', 'flower', 'blossom', 'osmanthus'] },
      { id: 'amber', label: 'Warm Amber & Resins', keywords: ['amber', 'resin', 'labdanum', 'benzoin', 'frankincense', 'olibanum', 'ambergris', 'amberwood'] },
      { id: 'woody', label: 'Sandalwood & Woods', keywords: ['sandalwood', 'cedar', 'cypress', 'vetiver', 'birch', 'wood', 'pine', 'lichen'] },
      { id: 'citrus', label: 'Fresh Citrus & Bergamot', keywords: ['bergamot', 'lemon', 'orange', 'mandarin', 'citrus', 'neroli'] },
      { id: 'aquatic', label: 'Aquatic & Marine Accord', keywords: ['aquatic', 'marine', 'sea salt', 'rain', 'water', 'driftwood', 'chill'] },
      { id: 'spices', label: 'Spices & Sacred Incense', keywords: ['pepper', 'cardamom', 'saffron', 'nutmeg', 'pimento', 'incense', 'clove', 'ginger'] },
      { id: 'leather', label: 'Leather & Dark Musk', keywords: ['leather', 'musk', 'ambrette', 'castoreum', 'truffle', 'charred'] }
    ]
  },
  {
    id: 'occasion',
    title: 'OCCASION & RITUAL',
    subtitle: 'Where & when to wear',
    options: [
      { id: 'evening', label: 'Royal Gala & Evening', desc: 'Opulent, magnetic, formal nightwear' },
      { id: 'daily', label: 'Daily Signature & Office', desc: 'Refined, versatile daily elegance' },
      { id: 'date-night', label: 'Intimate & Date Night', desc: 'Sensual warmth, close encounter allure' },
      { id: 'summer', label: 'Warm Summer & Sun', desc: 'Radiant citrus, sea breezes, vibrant heat' },
      { id: 'meditative', label: 'Spiritual & Meditative', desc: 'Sacred incense, temple resins, tranquil woods' }
    ]
  },
  {
    id: 'concentration',
    title: 'CONCENTRATION',
    subtitle: 'Oil potency ratio',
    options: [
      { id: 'extrait', label: 'Extrait de Parfum (35%–46%)', desc: 'Maximum oil concentration' },
      { id: 'edp', label: 'Eau de Parfum Intense', desc: 'Rich day-to-night projection' },
      { id: 'attar', label: 'Pure Royal Attar (100% Oil)', desc: 'Hydro-distilled alcohol-free pure oil' },
      { id: 'set', label: 'Discovery Coffrets', desc: 'Curated tasting flights' }
    ]
  },
  {
    id: 'price',
    title: 'PRICE TIER',
    subtitle: 'Flacon investment',
    options: [
      { id: 'under-5k', label: 'Under ₹5,000', min: 0, max: 4999 },
      { id: '5k-6500', label: '₹5,000 – ₹6,500', min: 5000, max: 6500 },
      { id: 'above-6500', label: 'Above ₹6,500', min: 6501, max: Infinity }
    ]
  }
];

// Returns normalized metadata classification for any product
export function classifyProduct(p) {
  const text = `${p.name || ''} ${p.category || ''} ${p.collection || ''} ${p.description || ''} ${p.concentration || ''} ${JSON.stringify(p.notes || {})}`.toLowerCase();

  // 1. Scent Intensity
  let intensity = 'moderate';
  if (
    text.includes('46%') ||
    text.includes('44%') ||
    text.includes('38%') ||
    text.includes('thunderstruck') ||
    text.includes('100% pure') ||
    text.includes('dehn al oud')
  ) {
    intensity = 'beastmode';
  } else if (
    text.includes('42%') ||
    text.includes('40%') ||
    text.includes('35%') ||
    text.includes('mystic') ||
    text.includes('deep canopy') ||
    text.includes('amber bark') ||
    text.includes('oud & roses')
  ) {
    intensity = 'intense';
  } else if (
    text.includes('afternoon') ||
    text.includes('accessories') ||
    text.includes('atomizer') ||
    text.includes('leather-travel')
  ) {
    intensity = 'soft';
  } else {
    intensity = 'moderate';
  }

  // 2. Olfactory Notes
  const matchedNotes = [];
  const noteSection = FILTER_SECTIONS.find((s) => s.id === 'notes');
  if (noteSection) {
    noteSection.options.forEach((opt) => {
      if (opt.keywords && opt.keywords.some((kw) => text.includes(kw))) {
        matchedNotes.push(opt.id);
      }
    });
  }

  // 3. Occasions
  const matchedOccasions = [];
  if (
    text.includes('oud') ||
    text.includes('royal') ||
    text.includes('gala') ||
    text.includes('46') ||
    text.includes('thunderstruck') ||
    text.includes('cambodi') ||
    text.includes('mystic')
  ) {
    matchedOccasions.push('evening');
  }
  if (
    text.includes('canopy') ||
    text.includes('fougere') ||
    text.includes('george') ||
    text.includes('office') ||
    text.includes('pacific') ||
    text.includes('citrus') ||
    text.includes('stellar')
  ) {
    matchedOccasions.push('daily');
  }
  if (
    text.includes('rose') ||
    text.includes('amber bark') ||
    text.includes('intimate') ||
    text.includes('guidance') ||
    text.includes('blooms') ||
    text.includes('vanilla') ||
    text.includes('velvet')
  ) {
    matchedOccasions.push('date-night');
  }
  if (
    text.includes('aquatic') ||
    text.includes('swim') ||
    text.includes('chill') ||
    text.includes('lemon') ||
    text.includes('solar') ||
    text.includes('neroli')
  ) {
    matchedOccasions.push('summer');
  }
  if (
    text.includes('frankincense') ||
    text.includes('incense') ||
    text.includes('canopy') ||
    text.includes('mystic') ||
    text.includes('sacred') ||
    text.includes('cambodi') ||
    text.includes('resin')
  ) {
    matchedOccasions.push('meditative');
  }

  // 4. Concentration
  let concentrationType = 'extrait';
  const cat = (p.category || '').toLowerCase();
  if (cat.includes('attar') || text.includes('attar')) {
    concentrationType = 'attar';
  } else if (cat.includes('eau de parfum') || text.includes('eau de parfum')) {
    concentrationType = 'edp';
  } else if (
    cat.includes('discovery') ||
    cat.includes('set') ||
    (p.name || '').toLowerCase().includes('coffret')
  ) {
    concentrationType = 'set';
  } else {
    concentrationType = 'extrait';
  }

  // 5. Price Bracket
  const price = p.price || 0;
  let priceBracket = 'under-5k';
  if (price > 6500) {
    priceBracket = 'above-6500';
  } else if (price >= 5000) {
    priceBracket = '5k-6500';
  } else {
    priceBracket = 'under-5k';
  }

  return {
    intensity,
    notes: matchedNotes,
    occasions: matchedOccasions,
    concentrationType,
    priceBracket
  };
}

// Matches a product against the active filters object
export function matchesFilters(product, activeFilters) {
  if (!activeFilters) return true;

  const meta = classifyProduct(product);

  // 1. Intensity filter (multi-select)
  if (activeFilters.intensity && activeFilters.intensity.length > 0) {
    if (!activeFilters.intensity.includes(meta.intensity)) {
      return false;
    }
  }

  // 2. Notes filter (multi-select: matches ANY selected note)
  if (activeFilters.notes && activeFilters.notes.length > 0) {
    const hasNote = activeFilters.notes.some((noteId) => meta.notes.includes(noteId));
    if (!hasNote) return false;
  }

  // 3. Occasion filter (multi-select: matches ANY selected occasion)
  if (activeFilters.occasion && activeFilters.occasion.length > 0) {
    const hasOccasion = activeFilters.occasion.some((occId) => meta.occasions.includes(occId));
    if (!hasOccasion) return false;
  }

  // 4. Concentration filter (multi-select)
  if (activeFilters.concentration && activeFilters.concentration.length > 0) {
    if (!activeFilters.concentration.includes(meta.concentrationType)) {
      return false;
    }
  }

  // 5. Price filter (multi-select)
  if (activeFilters.price && activeFilters.price.length > 0) {
    if (!activeFilters.price.includes(meta.priceBracket)) {
      return false;
    }
  }

  return true;
}

// Counts how many products match each filter option within the current candidate products
export function computeFilterCounts(products, activeFilters = {}) {
  const counts = {
    intensity: {},
    notes: {},
    occasion: {},
    concentration: {},
    price: {}
  };

  // Pre-classify all products
  const classified = products.map((p) => ({
    product: p,
    meta: classifyProduct(p)
  }));

  FILTER_SECTIONS.forEach((section) => {
    section.options.forEach((opt) => {
      // Calculate what products match when this option is applied
      let matchCount = 0;
      classified.forEach(({ product, meta }) => {
        // Create hypothetical filter state without other options in this section to allow multi-select discovery
        const testFilters = { ...activeFilters };
        delete testFilters[section.id];

        if (matchesFilters(product, testFilters)) {
          if (section.id === 'intensity' && meta.intensity === opt.id) matchCount++;
          else if (section.id === 'notes' && meta.notes.includes(opt.id)) matchCount++;
          else if (section.id === 'occasion' && meta.occasions.includes(opt.id)) matchCount++;
          else if (section.id === 'concentration' && meta.concentrationType === opt.id) matchCount++;
          else if (section.id === 'price' && meta.priceBracket === opt.id) matchCount++;
        }
      });
      counts[section.id][opt.id] = matchCount;
    });
  });

  return counts;
}

