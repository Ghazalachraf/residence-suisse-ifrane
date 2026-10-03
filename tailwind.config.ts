import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sapin: '#1E3A2F',
        cedre: '#2F5D4A',
        mousse: '#5E7F62',
        neige: '#FBFAF6',
        givre: '#F1F3EF',
        pierre: '#E4E1D8',
        granit: '#6B6A63',
        encre: '#1B231F',
        bois: '#7A5230',
        saison: 'var(--saison)',
      },
      fontFamily: {
        display: ['"Libre Caslon Display"', 'Georgia', 'serif'],
        sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
