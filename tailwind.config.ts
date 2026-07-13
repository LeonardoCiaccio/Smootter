import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./src/**/*.{vue,ts}', './src/**/*.html'],
  theme: {
    extend: {
      borderRadius: {
        tool: '0.375rem',
      },
      // Every `cyan-*` utility across the app is retinted to a dodgerblue-based ramp
      // (500 = dodgerblue itself) one place, propagates everywhere it's used.
      colors: {
        cyan: {
          50: '#eff8ff',
          100: '#dbeeff',
          200: '#b8ddff',
          300: '#7cc2ff',
          400: '#3aa0ff',
          500: '#1e90ff',
          600: '#0d6ee0',
          700: '#0a58b3',
          800: '#0d4a8f',
          900: '#113f73',
          950: '#0b2748',
        },
      },
      fontFamily: {
        sans: ['"PT Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['"Open Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        subheading: ['"Cooper Hewitt"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
