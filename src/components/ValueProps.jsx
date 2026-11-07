import React from 'react';

export default function ValueProps() {
  const items = [
    {
      title: 'International Shipping',
      description: 'Worldwide express insured courier delivery to over 140 countries. Handled with museum-grade care.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path clipRule="evenodd" d="m20.055 20.198.654-.654c.36-.36.502-.885.373-1.378l-2.326-8.837 3.075-3.075a2.972 2.972 0 0 0 .422-3.794 2.867 2.867 0 0 0-4.369-.37l-3.183 3.185L5.867 2.95a1.434 1.434 0 0 0-1.38.373l-.653.654A1.434 1.434 0 0 0 4.11 6.22l6.03 3.618-4.589 5.2-1.434.02a1.434 1.434 0 0 0-1.225.37L1.46 16.74a.716.716 0 0 0 .225 1.165l2.767 1.56 1.816 2.864a.718.718 0 0 0 1.166.224l1.251-1.193c.354-.333.515-.822.428-1.3l.023-1.438 5.058-4.73 3.618 6.03a1.434 1.434 0 0 0 2.243.276Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Client Concierge',
      description: 'Consult directly with our Dubai perfumery masters via WhatsApp (+971 54 247 7037) or private appointment.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12.75 15.75h3v4.5l4.5-4.5h1.494c.832 0 1.506-.674 1.506-1.506V2.25a1.5 1.5 0 0 0-1.5-1.5h-12a1.5 1.5 0 0 0-1.5 1.5v4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path clipRule="evenodd" d="M6.75 16.5a3.375 3.375 0 1 0 0-6.75 3.375 3.375 0 0 0 0 6.75Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12.75 23.25a6.054 6.054 0 0 0-12 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Secure Payment',
      description: 'Encrypted checkout with Visa, Mastercard, American Express, Apple Pay, Tabby & Tamara.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path clipRule="evenodd" d="M.75 5.25a1.5 1.5 0 0 1 1.5-1.5h19.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H2.25a1.5 1.5 0 0 1-1.5-1.5V5.25Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M.75 8.25h22.5m-18 4.5h8.25m-8.25 3h5.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
  ];

  return (
    <section className="py-14 sm:py-16 bg-[#141418] text-[#F7F5F0] border-b border-tk-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-tk-gold/20">
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center px-4 pt-6 md:pt-0">
              <div className="w-14 h-14 rounded-full bg-[#0A0A0C] border border-tk-gold/40 text-tk-gold flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                {item.icon}
              </div>
              <h4 className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-white mb-2 font-sans">
                {item.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-white/65 font-light max-w-xs leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
