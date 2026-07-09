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
  layoutCenter: 'relative w-full max-w-7xl h-full overflow-hidden bg-white dark:bg-gray-900',
  statusText: 'text-lg font-semibold text-gray-900 dark:text-gray-100',
  // Home hero: pushed toward the top, with breathing room below the outer toolbar
  heroWrapper: 'flex flex-col items-center gap-4 px-6 pt-16 text-center',
  heroHeader:
    'bg-gradient-to-r from-violet-600 to-cyan-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl',
  heroSubheader: 'max-w-md text-base text-gray-600 dark:text-gray-400',
  // Tools panel: empty state, a decently-sized dashed "add" card acting as a button
  toolsPanel: 'mt-24 flex justify-center px-6',
  toolsEmptyButton:
    'group flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 px-10 py-8 text-gray-500 transition-colors hover:border-gray-500 hover:text-gray-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-300 dark:hover:text-gray-300',
  toolsEmptyIconWrap:
    'flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors group-hover:bg-gray-500/10 group-hover:text-gray-500 dark:bg-gray-800 dark:text-gray-500 dark:group-hover:bg-gray-300/10 dark:group-hover:text-gray-300',
  toolsEmptyIcon: 'h-6 w-6',
  toolsEmptyLabel: 'text-sm font-medium',
  // Non-home views: a fixed breadcrumb on top, content filling the rest.
  viewShell: 'flex h-full flex-col',
  viewContent: 'flex flex-1 items-center justify-center',
  breadcrumb: 'flex items-center gap-1.5 self-start px-6 pt-6 text-sm font-medium',
  breadcrumbHome:
    'text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
  breadcrumbSeparator: 'text-gray-300 dark:text-gray-600',
  breadcrumbCurrent: 'text-gray-900 dark:text-gray-100',
} as const

export type UiVariant = keyof typeof ui
