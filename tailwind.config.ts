import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'slate-dark': '#0f172a',
        'slate-darker': '#1a1f3a',
        'slate-card': '#1e293b',
        'teal-accent': '#2dd4bf',
        'cyan-accent': '#06b6d4',
      },
      backgroundColor: {
        'dark-primary': '#0f172a',
        'dark-secondary': '#1e293b',
        'dark-tertiary': '#334155',
      },
    },
  },
  plugins: [],
};

export default config;
