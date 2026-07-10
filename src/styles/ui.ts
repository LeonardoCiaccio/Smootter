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
    'w-full resize-none rounded-tool border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500',
  // 3-column boxed layout: empty side columns, app content in the center (max-w-7xl = 1280px)
  layoutRoot: 'flex h-full w-full bg-white dark:bg-gray-900',
  layoutSide: 'flex-1 h-full',
  layoutCenter: 'relative w-full max-w-7xl h-full overflow-hidden bg-white dark:bg-gray-900',
  statusText: 'text-lg font-semibold text-gray-900 dark:text-gray-100',
  // Home hero: pushed toward the top, with breathing room below the outer toolbar
  heroWrapper: 'flex flex-col items-center gap-4 px-6 pt-16 text-center',
  heroHeader:
    'bg-gradient-to-r from-violet-600 to-cyan-400 bg-clip-text pb-1 text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl',
  heroSubheader: 'max-w-md text-base text-gray-600 dark:text-gray-400',
  // Tools panel: empty state, plain icon + label (icon follows text color via currentColor)
  toolsPanel: 'mt-24 flex justify-center px-6',
  toolsEmptyButton:
    'inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
  toolsEmptyIcon: 'h-5 w-5',
  // Non-home views: a fixed breadcrumb on top, content filling the rest.
  viewShell: 'flex h-full flex-col',
  viewContent: 'flex flex-1 items-center justify-center',
  breadcrumb: 'flex items-center gap-1.5 self-start px-6 pt-6 text-sm font-medium',
  breadcrumbHome:
    'text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
  breadcrumbSeparator: 'text-gray-300 dark:text-gray-600',
  breadcrumbCurrent: 'text-gray-900 dark:text-gray-100',
  // Wizard viewport: centers the wizard both ways within the view
  wizardViewport: 'flex flex-1 items-center justify-center px-6 py-6',
  // Wizard: fixed 3-row layout (header / body / dots), 70% of the viewport height
  wizardWrapper: 'flex h-[70%] w-full max-w-md flex-col items-center text-center',
  wizardHeader: 'flex flex-col gap-1.5 pb-6',
  wizardTitle:
    'bg-gradient-to-r from-cyan-500 to-emerald-400 bg-clip-text pb-1 text-4xl font-extrabold tracking-tight text-transparent',
  wizardSubtitle: 'text-sm text-gray-500 dark:text-gray-400',
  wizardBody: 'flex w-full flex-1 flex-col justify-center overflow-y-auto',
  wizardStepBody: 'flex w-full flex-col gap-4 text-left',
  wizardField: 'flex flex-col gap-1.5 text-left',
  wizardFieldLabel: 'text-sm font-medium text-gray-700 dark:text-gray-300',
  wizardCounter: 'self-end text-xs text-gray-400 dark:text-gray-500',
  // Dots: inactive = small circle, active = elongated pill (smooth width transition)
  wizardSteps: 'flex items-center justify-center gap-2 pt-6',
  wizardStepDot:
    'h-2 w-2 rounded-full bg-gray-300 transition-all duration-200 hover:bg-gray-400 dark:bg-gray-300 dark:hover:bg-gray-200',
  wizardStepDotActive: 'w-6 bg-gray-900 hover:bg-gray-900 dark:bg-gray-100 dark:hover:bg-gray-100',
  // Wizard trigger step: 3 selectable cards (whole card is the click target)
  wizardTriggerList: 'flex w-full flex-col gap-3',
  wizardTriggerOption:
    'flex w-full items-start gap-3 rounded-2xl border border-gray-200 p-4 text-left transition-colors hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700',
  wizardTriggerOptionSelected:
    'border-cyan-500 hover:border-cyan-500 dark:border-cyan-400 dark:hover:border-cyan-400',
  wizardTriggerRadio:
    'mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600',
  wizardTriggerRadioSelected: 'border-cyan-500 dark:border-cyan-400',
  wizardTriggerRadioDot: 'h-2 w-2 rounded-full bg-cyan-500 dark:bg-cyan-400',
  wizardTriggerText: 'flex flex-col gap-0.5',
  wizardTriggerTitle: 'text-sm font-semibold text-gray-900 dark:text-gray-100',
  wizardTriggerDescription: 'text-xs text-gray-500 dark:text-gray-400',
} as const

export type UiVariant = keyof typeof ui
