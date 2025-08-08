import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ed1c24',
          600: '#d41920',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
      },
      backgroundColor: {
        primary: '#ed1c24',
        'primary-hover': '#d41920',
        'primary-dark': '#b91c1c',
      },
      textColor: {
        primary: '#ed1c24',
        'primary-hover': '#d41920',
      },
      borderColor: {
        primary: '#ed1c24',
        'primary-hover': '#d41920',
      },
      boxShadow: {
        primary: '0 4px 12px rgba(237, 28, 36, 0.3)',
        'primary-focus': '0 0 0 3px rgba(237, 28, 36, 0.2)',
      },
    },
  },
  plugins: [],
};
export default config;
