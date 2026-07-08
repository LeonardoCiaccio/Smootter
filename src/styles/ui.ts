/**
 * Centralized styles.
 * One place per element type. Components import from here.
 * Never hardcode/repeat Tailwind classes in .vue files.
 */
export const ui = {
  toolButton:
    'inline-flex items-center justify-center rounded-tool p-2 text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand',
  primaryButton:
    'inline-flex items-center justify-center gap-2 rounded-tool bg-brand px-4 py-2 text-brand-fg transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand',
  card: 'rounded-tool border border-gray-200 bg-white p-4 shadow-sm',
  input:
    'w-full rounded-tool border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand',
} as const

export type UiVariant = keyof typeof ui
