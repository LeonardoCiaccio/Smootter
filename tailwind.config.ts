import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{vue,ts}', './src/**/*.html'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#e25822',
          fg: '#ffffff',
        },
      },
      borderRadius: {
        tool: '0.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config
