/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'base-100': 'var(--base-100)',
        'base-200': 'var(--base-200)',
        'base-300': 'var(--base-300)',
        'content-100': 'var(--content-100)',
        'content-200': 'var(--content-200)',
        'brand-primary': 'var(--brand-primary)',
        'brand-secondary': 'var(--brand-secondary)',
        'neutral-200': 'var(--neutral-200)',
        'neutral-300': 'var(--neutral-300)',
        'border-color': 'var(--border-color)',
        'dark-base-100': 'var(--dark-base-100)',
        'dark-base-200': 'var(--dark-base-200)',
        'dark-base-300': 'var(--dark-base-300)',
        'dark-content-100': 'var(--dark-content-100)',
        'dark-content-200': 'var(--dark-content-200)',
        'dark-brand-primary': 'var(--dark-brand-primary)',
        'dark-brand-secondary': 'var(--dark-brand-secondary)',
        'dark-neutral-200': 'var(--dark-neutral-200)',
        'dark-neutral-300': 'var(--dark-neutral-300)',
        'dark-border-color': 'var(--dark-border-color)',
      },
    },
  },
  plugins: [],
}