// Initial seed reviews for Saudagar Haute Parfumerie creations
export const DEFAULT_PRODUCT_REVIEWS = {
  'saudagar-thunderstruck-oud': [
    {
      id: 'rev-th-1',
      author: 'Lord Julian Sterling',
      location: 'Mayfair, London',
      isVerified: true,
      rating: 5,
      date: '2 days ago',
      title: 'A toweringCambodi masterwork — lasts beyond 16 hours',
      comment: 'Thunderstruck Pure Oud is uncompromising luxury. The smoky opening yields to the most velvet, resinous agarwood I have encountered outside vintage artisan distillations. The heavy glass flacon and hand-engraved plaque feel magnificent on the dressing table.',
      images: [
        '/images/saudagar_amber_gold.png',
        '/images/saudagar_flacon_box.png'
      ],
      longevity: '16+ Hours',
      sillage: 'Beastmode Royal',
      helpfulCount: 38
    },
    {
      id: 'rev-th-2',
      author: 'Farhan Al-Qasimi',
      location: 'Dubai, UAE',
      isVerified: true,
      rating: 5,
      date: '1 week ago',
      title: 'The gold standard of royal extrait',
      comment: 'Wore this to a private gala in DIFC. Countless inquiries on what I was wearing. The Cambodian oud is mature, deeply fermented with zero barnyard sharpness, smoothed by royal Taif rose petals.',
      images: [
        '/images/macro_bottle_cap.jpg'
      ],
      longevity: '14+ Hours',
      sillage: 'Radiant Aura',
      helpfulCount: 22
    },
    {
      id: 'rev-th-3',
      author: 'Ananya Deshmukh',
      location: 'Mumbai, India',
      isVerified: true,
      rating: 5,
      date: '2 weeks ago',
      title: 'Flacon presentation and atomizer are sublime',
      comment: 'Ordered with custom calligraphy engraving. Arrived in Mumbai within 48 hours via insured air courier. The complimentary 2ml discovery vial gave me the confidence to open the presentation box without hesitation. 10/10.',
      images: [],
      longevity: '12-14 Hours',
      sillage: 'Intense',
      helpfulCount: 15
    }
  ],
  'saudagar-deep-canopy': [
    {
      id: 'rev-dc-1',
      author: 'Marcus Vance',
      location: 'Zurich, Switzerland',
      isVerified: true,
      rating: 5,
      date: '3 days ago',
      title: 'Botanical petrichor meets ancient agarwood resin',
      comment: 'Deep Canopy is an olfactory triumph. Opens like a dense alpine pine forest after violent rainfall, followed by a dark, brooding mineral lichen accord. The sillage is room-commanding yet never suffocating.',
      images: [
        '/images/saudagar_noir_matte.png',
        '/images/saudagar_flacon_box.png'
      ],
      longevity: '15+ Hours',
      sillage: 'Beastmode Royal',
      helpfulCount: 42
    },
    {
      id: 'rev-dc-2',
      author: 'Elena Rostova',
      location: 'Milan, Italy',
      isVerified: true,
      rating: 5,
      date: '1 week ago',
      title: 'Pure poetry in a flacon',
      comment: 'The contrast of cold rain accords and 18-year aged Cambodian oud is hypnotic. Easily the most complimented fragrance in my 40-bottle niche collection.',
      images: [
        '/images/macro_bottle_cap.jpg'
      ],
      longevity: '14+ Hours',
      sillage: 'Intense',
      helpfulCount: 19
    }
  ],
  'saudagar-amber-bark': [
    {
      id: 'rev-ab-1',
      author: 'Zaid Bin Tariq',
      location: 'Abu Dhabi, UAE',
      isVerified: true,
      rating: 5,
      date: '4 days ago',
      title: 'Solar amber that glows like desert sunset',
      comment: 'Amber Bark combines golden frankincense with sun-warmed cedar. The drydown melts into an opulent amber aura that clings to cashmere for days.',
      images: [
        '/images/crystal_square_flacon.png'
      ],
      longevity: '14+ Hours',
      sillage: 'Beastmode Royal',
      helpfulCount: 27
    }
  ]
};

// Fallback generic reviews for any product without custom entries
export const GENERIC_DEFAULT_REVIEWS = [
  {
    id: 'rev-gen-1',
    author: 'Alexander Sinclair',
    location: 'Geneva, Switzerland',
    isVerified: true,
    rating: 5,
    date: '4 days ago',
    title: 'Extraordinary depth and opulent craftsmanship',
    comment: 'The maceration and botanical concentration in this extrait are immediately evident upon the first atomization. Exceptional drydown with complex nuances that evolve gracefully throughout the day.',
    images: [
      '/images/saudagar_flacon_box.png',
      '/images/macro_bottle_cap.jpg'
    ],
    longevity: '14+ Hours',
    sillage: 'Beastmode Royal',
    helpfulCount: 31
  },
  {
    id: 'rev-gen-2',
    author: 'Samira Al-Hassan',
    location: 'Riyadh, Saudi Arabia',
    isVerified: true,
    rating: 5,
    date: '1 week ago',
    title: 'A true royal treasure',
    comment: 'From the heavyweight crystal flacon to the masterfully blended oils, Saudagar represents haute parfumerie at its finest. Received immense compliments during evening majlis.',
    images: [
      '/images/crystal_square_flacon.png'
    ],
    longevity: '16+ Hours',
    sillage: 'Intense',
    helpfulCount: 24
  },
  {
    id: 'rev-gen-3',
    author: 'David Chen',
    location: 'Singapore',
    isVerified: true,
    rating: 4,
    date: '2 weeks ago',
    title: 'Luxurious formulation with great projection',
    comment: 'A rich and nuanced scent profile. Projects intensely for the first 5 hours before settling into an exquisite, long-lasting skin scent. The presentation packaging is unmatched.',
    images: [],
    longevity: '10-12 Hours',
    sillage: 'Radiant Aura',
    helpfulCount: 16
  }
];

export function getProductReviews(productId) {
  try {
    const local = localStorage.getItem(`saudagar_reviews_${productId}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading reviews from localStorage', e);
  }

  return DEFAULT_PRODUCT_REVIEWS[productId] || GENERIC_DEFAULT_REVIEWS;
}

export function saveProductReviews(productId, reviews) {
  try {
    localStorage.setItem(`saudagar_reviews_${productId}`, JSON.stringify(reviews));
  } catch (e) {
    console.warn('Error saving reviews to localStorage', e);
  }
}

