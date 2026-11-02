/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
        sans: ['"Poppins"', '"Outfit"', '"DM Sans"', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        poppins: ['"Poppins"', 'sans-serif'],
        heading: ['"Poppins"', 'sans-serif'],
        outfit: ['"Outfit"', 'sans-serif'],
        dmsans: ['"DM Sans"', 'sans-serif'],
        prompt: ['"Prompt"', 'sans-serif'],
        serif: ['"IM Fell French Canon"', '"Zen Antique Soft"', 'Cormorant Garamond', 'Garamond', 'Georgia', 'serif'],
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
