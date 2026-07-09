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
  // 3-column boxed layout: empty side columns, app content in the center (max-w-7xl = 1280px)
  layoutRoot: 'flex h-full w-full bg-white dark:bg-gray-900',
  layoutSide: 'flex-1 h-full',
  layoutCenter: 'relative w-full max-w-7xl h-full overflow-hidden bg-gray-50 dark:bg-gray-800',
  pageContent: 'flex h-full items-center justify-center',
  statusText: 'text-lg font-semibold text-gray-900 dark:text-gray-100',
  // Non-home views: a fixed breadcrumb on top, content filling the rest.
  viewShell: 'flex h-full flex-col',
  viewContent: 'flex flex-1 items-center justify-center',
  breadcrumb:
    'inline-flex items-center gap-1.5 self-start px-6 pt-6 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
  breadcrumbIcon: 'h-4 w-4',
} as const

export type UiVariant = keyof typeof ui
