/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // One small corner across the shop and admin (buttons, cards, images, panels). Circles use rounded-full.
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: '2px',
      DEFAULT: '2px',
      md: '2px',
      lg: '2px',
      xl: '3px',
      '2xl': '3px',
      '3xl': '3px',
      full: '9999px',
    },
    extend: {
      colors: {
        // Theme tokens: set at runtime from Admin → Site content → Theme (src/cms/ThemeRuntime.tsx)
        'tk-accent': 'rgb(var(--c-accent) / <alpha-value>)',
        'tk-accent-ink': 'rgb(var(--c-accent-ink) / <alpha-value>)',
        'tk-accent-night': 'rgb(var(--c-accent-night) / <alpha-value>)',
        'tk-gold': 'rgb(var(--c-gold) / <alpha-value>)',
        'tk-ink': 'rgb(var(--c-ink) / <alpha-value>)',
        'tk-night': 'rgb(var(--c-night) / <alpha-value>)',
        'brand-black': '#111111',
        'brand-surface': '#ECEBE6',
        'brand-card': '#FFFFFF',
        'brand-alabaster': '#F4F3EE',
        'brand-amber': '#C4823F',
        'brand-amber-dark': '#B57432',
        'brand-gold': '#D4AF37',
        'brand-gold-light': '#ECC86A',
        'brand-cream': '#EFECE6',
        'brand-border': '#111111',
        obsidian: '#111111',
        carbon: '#1C1C1E',
        charcoal: '#222222',
        stone: '#555555',
        ivory: '#ECEBE6',
        'ivory-warm': '#F4F3EE',
        amber: {
          light: '#DE9954',
          DEFAULT: '#C4823F',
          dark: '#B57432'
        },
        gold: {
          light: '#ECC86A',
          DEFAULT: '#D4AF37',
          dark: '#9E7D23'
        }
      },
      fontFamily: {
        sans: ['var(--font-body)', '"Poppins"', '"Outfit"', '"DM Sans"', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        poppins: ['"Poppins"', 'sans-serif'],
        heading: ['"Poppins"', 'sans-serif'],
        outfit: ['"Outfit"', 'sans-serif'],
        dmsans: ['"DM Sans"', 'sans-serif'],
        prompt: ['"Prompt"', 'sans-serif'],
        serif: ['var(--font-display)', '"IM Fell French Canon"', '"Zen Antique Soft"', 'Cormorant Garamond', 'Garamond', 'Georgia', 'serif'],
        script: ['"Lavishly Yours"', '"Imperial Script"', 'cursive'],
        imperial: ['"Imperial Script"', 'cursive'],
        canon: ['"IM Fell French Canon"', 'serif'],
        antique: ['"Zen Antique Soft"', 'serif'],
        quintessential: ['"Quintessential"', 'cursive'],
      },
    },
  },
  plugins: [],
};
