import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sand: '#f5efe7',
        clay: '#b7794a',
        bark: '#5b3627',
        moss: '#758467',
      },
      backgroundImage: {
        halo: 'radial-gradient(circle at top, rgba(183,121,74,0.24), transparent 45%)',
      },
    },
  },
  plugins: [],
};

export default config;
