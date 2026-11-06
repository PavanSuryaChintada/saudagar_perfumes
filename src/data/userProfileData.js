// Default luxury profile for Saudagar Haute Parfumerie connoisseurs
export const DEFAULT_USER_PROFILE = {
  id: 'sau-patron-88219',
  firstName: 'Aditya',
  lastName: 'Verma',
  email: 'aditya.verma@saudagarconnoisseur.com',
  phone: '+91 98200 44211',
  birthday: '1992-08-14',
  memberTier: 'Royal Patron Circle',
  tierLevel: 'Connoisseur VIP',
  memberSince: 'October 2023',
  points: 1480,
  concierge: 'Maitre Parfumeur Tariq (Dubai Atelier)',
  defaultEngraving: 'A. VERMA',
  engravingStyle: 'Imperial Roman Serif',
  olfactoryDNA: {
    primaryFamily: 'Smoky Oriental & Resinous Amber',
    favoriteNotes: ['18-Year Cambodi Oud', 'Taif Rose Petals', 'Mysore Sandalwood', 'Dark Ambergris'],
    preferredSillage: 'Beastmode Royal (14+ hrs)',
    preferredConcentration: 'Extrait de Parfum (38–46% pure oil)'
  },
  addresses: [
    {
      id: 'addr-1',
      isDefault: true,
      tag: 'Primary Residence',
      fullName: 'Aditya Verma',
      street: '42 Altamount Road, Malabar Hill',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400026',
      country: 'India',
      phone: '+91 98200 44211'
    },
    {
      id: 'addr-2',
      isDefault: false,
      tag: 'Private Suite',
      fullName: 'Aditya Verma',
      street: 'DIFC Gate Village, Building 03, Suite 402',
      city: 'Dubai',
      state: 'Dubai',
      postalCode: '00000',
      country: 'United Arab Emirates',
      phone: '+971 50 123 4567'
    }
  ],
  orders: [
    {
      id: 'SAU-177987',
      date: 'November 4, 2026',
      status: 'Delivered',
      deliveryService: 'Priority White-Glove Air Courier',
      trackingCode: 'SAU-EXP-992144-DXB',
      totalAmount: 12100,
      currency: 'INR',
      items: [
        {
          id: 'saudagar-thunderstruck-oud',
          name: 'Saudagar Thunderstruck Pure Oud Extrait',
          size: '100 ml',
          quantity: 1,
          price: 5500,
          image: '/images/saudagar_amber_gold.png',
          engraving: 'A. VERMA'
        },
        {
          id: 'saudagar-deep-canopy',
          name: '001 Deep Canopy Mineral Extrait',
          size: '50 ml',
          quantity: 1,
          price: 6600,
          image: '/images/saudagar_noir_matte.png',
          engraving: 'SAUDAGAR I'
        }
      ]
    },
    {
      id: 'SAU-164420',
      date: 'September 18, 2026',
      status: 'Delivered',
      deliveryService: 'Standard Insured Air Courier',
      trackingCode: 'SAU-STD-882019-BOM',
      totalAmount: 6400,
      currency: 'INR',
      items: [
        {
          id: 'saudagar-amber-bark',
          name: '002 Amber Bark Solar Resin',
          size: '50 ml',
          quantity: 1,
          price: 6400,
          image: '/images/crystal_square_flacon.png',
          engraving: 'A.V.'
        }
      ]
    }
  ]
};

export function getStoredUserProfile() {
  try {
    const raw = localStorage.getItem('saudagar_user_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) return parsed;
    }
  } catch (e) {
    console.warn('Error reading stored user profile', e);
  }
  return DEFAULT_USER_PROFILE;
}

export function saveStoredUserProfile(profile) {
  try {
    localStorage.setItem('saudagar_user_profile', JSON.stringify(profile));
  } catch (e) {
    console.warn('Error saving user profile to storage', e);
  }
}

