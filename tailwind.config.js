/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        gold: {
          DEFAULT: '#F5C842',
          hover: '#E5B731',
          dark: '#D97706',
        },
        crystal: {
          DEFAULT: '#6EE7F7',
          glow: 'rgba(110, 231, 247, 0.4)',
        },
        biome: {
          fire: '#FF5733',
          nature: '#4ADE80',
          ivory: '#FAF0C8',
          sand: '#FB923C',
          ancient: '#C084FC',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
