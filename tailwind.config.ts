import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./src/**/*.{vue,ts}', './src/**/*.html'],
  theme: {
    extend: {
      borderRadius: {
        tool: '0.375rem',
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
