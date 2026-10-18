/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: {
            DEFAULT: '#102A43',
            dark: '#0B1D3A',
            light: '#1E3A5F',
            subtle: '#F0F4F8',
          },
          emerald: {
            DEFAULT: '#047857',
            dark: '#065F46',
            light: '#059669',
            subtle: '#ECFDF5',
          },
          mint: {
            DEFAULT: '#10B981',
            light: '#34D399',
            subtle: '#D1FAE5',
          },
        },
      },
    },
  },
  plugins: [],
};
