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
  // App shell: toolbar (top) + boxed content row (middle, flex-1) + footer (bottom)
  appShell: 'flex h-full w-full flex-col bg-white dark:bg-gray-900',
  // 3-column boxed layout: empty side columns, app content in the center (max-w-7xl = 1280px)
  layoutRoot: 'flex w-full min-h-0 flex-1',
  layoutSide: 'flex-1 h-full',
  layoutCenter: 'relative w-full max-w-7xl h-full overflow-hidden',
  // Toolbar: app info (left) · top message pill (center) · actions (right)
  toolbar: 'grid flex-shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-4',
  toolbarAppInfo: 'flex items-center gap-2 justify-self-start text-gray-900 dark:text-gray-100',
  toolbarLogo: 'h-5 w-5',
  toolbarAppName: 'text-sm font-semibold',
  toolbarAppVersion: 'text-xs opacity-60',
  toolbarPill:
    'flex min-w-0 max-w-xs items-center gap-2 justify-self-center rounded-full bg-gray-100 px-4 py-1.5 dark:bg-gray-800',
  toolbarPillDot: 'h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400',
  toolbarPillText: 'truncate text-xs font-medium text-gray-700 dark:text-gray-300',
  toolbarActions: 'flex items-center gap-2 justify-self-end',
  toolbarIconButton:
    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
  toolbarCloseButton:
    'ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
  toolbarIcon: 'h-4 w-4',
  // Footer: general info (copyright, version)
  footer: 'flex-shrink-0 px-5 py-2.5 text-center text-[11px] text-gray-400 dark:text-gray-500',
  statusText: 'text-lg font-semibold text-gray-900 dark:text-gray-100',
  // Home hero: pushed toward the top (the toolbar above is a normal in-flow element now)
  heroWrapper: 'flex flex-col items-center gap-4 px-6 pt-10 text-center',
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
  // Wizard option cards: reused by any step with a selectable-card list (whole card is the click target)
  wizardOptionList: 'flex w-full flex-col gap-3',
  wizardOption:
    'flex w-full items-start gap-3 rounded-2xl border border-gray-200 p-4 text-left transition-colors hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700',
  wizardOptionSelected:
    'border-cyan-500 hover:border-cyan-500 dark:border-cyan-400 dark:hover:border-cyan-400',
  wizardOptionRadio:
    'mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600',
  wizardOptionRadioSelected: 'border-cyan-500 dark:border-cyan-400',
  wizardOptionRadioDot: 'h-2 w-2 rounded-full bg-cyan-500 dark:bg-cyan-400',
  wizardOptionText: 'flex flex-col gap-0.5',
  wizardOptionTitle: 'text-sm font-semibold text-gray-900 dark:text-gray-100',
  wizardOptionDescription: 'text-xs text-gray-500 dark:text-gray-400',
  // Toast notifications: stacked, top-centered, one variant per type
  toastContainer: 'pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4',
  toast: 'pointer-events-auto flex max-w-sm items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg',
  toastIcon: 'h-5 w-5 flex-shrink-0',
  toastInfo:
    'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200',
  toastSuccess:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  toastWarning:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
  toastError:
    'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200',
} as const

export type UiVariant = keyof typeof ui
