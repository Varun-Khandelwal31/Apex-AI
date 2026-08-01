/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        apex: {
          bg: '#0A0A0A',
          card: '#121216',
          border: '#1F2029',
          red: '#E10600',
          redGlow: '#FF1E27',
          cyan: '#00F0FF',
          green: '#39FF14',
          yellow: '#FFD700',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
