import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./src/**/*.{vue,ts}', './src/**/*.html'],
  theme: {
    extend: {
      borderRadius: {
        tool: '0.375rem',
      },
    },
  },
  plugins: [],
} satisfies Config
