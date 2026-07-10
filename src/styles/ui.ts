/**
 * Centralized styles.
 * One place per element type. Components import from here.
 * Never hardcode/repeat Tailwind classes in .vue files.
 */
export const ui = {
  toolButton:
    'inline-flex items-center justify-center rounded-tool p-2 text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500',
  primaryButton:
    'inline-flex items-center justify-center gap-2 rounded-tool bg-cyan-600 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-cyan-600',
  secondaryButton:
    'inline-flex items-center justify-center gap-2 rounded-tool border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
  dangerButton:
    'inline-flex items-center justify-center gap-2 rounded-tool border border-rose-300 px-3.5 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950',
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
  heroWrapper: 'flex flex-col items-center gap-4 px-6 pt-20 text-center',
  heroHeader:
    'bg-gradient-to-r from-violet-600 to-cyan-400 bg-clip-text pb-1 text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl',
  heroSubheader: 'max-w-md text-base text-gray-600 dark:text-gray-400',
  // Tools panel: empty state, plain icon + label (icon follows text color via currentColor)
  toolsPanel: 'mt-24 flex justify-center px-6',
  toolsEmptyButton:
    'inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
  toolsEmptyIcon: 'h-5 w-5',
  // Saved tools: 4-column grid, one card per tool (whole card is the click target)
  toolsList: 'grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4',
  toolCard:
    'group relative flex h-32 w-full flex-col gap-1 rounded-tool border border-gray-200 p-4 text-left transition-colors hover:border-cyan-500 dark:border-gray-800 dark:hover:border-cyan-400',
  toolCardTitle: 'truncate pr-14 text-sm font-semibold text-gray-900 dark:text-gray-100',
  toolCardDescription: 'line-clamp-2 flex-1 text-xs text-gray-500 dark:text-gray-400',
  toolCardMetaRow: 'flex items-center justify-between gap-2',
  toolCardMeta: 'min-w-0 flex-1 truncate text-[11px] text-gray-400 dark:text-gray-500',
  // Enable/disable switch, right after the dates.
  switchTrack: 'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors',
  switchTrackOff: 'bg-gray-300 dark:bg-gray-600',
  switchTrackOn: 'bg-cyan-600 dark:bg-cyan-500',
  switchThumb: 'inline-block h-3.5 w-3.5 translate-x-1 rounded-full bg-white transition-transform',
  switchThumbOn: 'translate-x-[1.125rem]',
  toolCardActions:
    'absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100',
  toolCardActionButton:
    'flex h-6 w-6 items-center justify-center rounded-tool text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200',
  toolCardDeleteConfirm:
    'flex h-6 w-6 items-center justify-center rounded-tool text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950',
  toolCardIcon: 'h-3.5 w-3.5',
  // First card in the grid (only shown once tools exist): opens the wizard to add a new tool.
  addToolCard:
    'flex h-32 w-full flex-col items-center justify-center gap-1.5 rounded-tool border border-dashed border-gray-300 text-gray-400 transition-colors hover:border-cyan-500 hover:text-cyan-600 dark:border-gray-700 dark:text-gray-500 dark:hover:border-cyan-400 dark:hover:text-cyan-400',
  addToolCardIcon: 'h-6 w-6',
  addToolCardLabel: 'text-xs font-medium',
  // Non-home views: a fixed breadcrumb on top, content filling the rest.
  viewShell: 'flex h-full flex-col',
  viewContent: 'flex flex-1 items-center justify-center',
  // Options: no sidebar (too few settings), sections centered in the page, fields left-aligned within.
  optionsContent: 'flex flex-1 flex-col items-center overflow-y-auto px-8 py-6',
  optionsSection: 'mt-8 flex w-full max-w-md flex-col gap-4 text-left',
  optionsSectionTitle: 'text-sm font-semibold text-gray-900 dark:text-gray-100',
  optionsSectionDescription: 'text-xs text-gray-500 dark:text-gray-400',
  optionsSectionActions: 'flex items-center justify-between gap-3',
  breadcrumb: 'flex items-center gap-1.5 self-start px-6 pt-6 text-sm font-medium',
  breadcrumbHome:
    'text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
  breadcrumbSeparator: 'text-gray-300 dark:text-gray-600',
  breadcrumbCurrent: 'text-gray-900 dark:text-gray-100',
  // Quick save (edit mode only): styled as a breadcrumb segment, colored to stand out from the plain trail.
  breadcrumbSaveAction: 'font-semibold text-cyan-600 transition-colors hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300',
  // Wizard viewport: centers the wizard both ways within the view
  wizardViewport: 'flex flex-1 items-center justify-center px-6 pb-6 pt-6',
  // Wizard: fixed 3-row layout (header / body / dots), 78% of the viewport height.
  // Width is split base/modifier (never combine two max-w-* at once — same class wins on cascade order, not attribute order).
  wizardWrapperBase: 'flex h-[78%] w-full flex-col items-center text-center',
  wizardWrapperWidth: 'max-w-xl',
  wizardWrapperWidthWide: 'max-w-none',
  wizardHeader: 'flex flex-col gap-1 pb-1',
  wizardTitle:
    'bg-gradient-to-r from-cyan-500 to-emerald-400 bg-clip-text pb-1 text-3xl font-extrabold tracking-tight text-transparent',
  wizardSubtitle: 'text-sm text-gray-500 dark:text-gray-400',
  wizardBody:
    'flex w-full min-h-0 flex-1 flex-col justify-center overflow-y-auto pr-1 [scrollbar-gutter:stable]',
  wizardStepBody: 'flex w-full flex-col gap-4 text-left',
  // Fills the body instead of being centered — for steps whose content should occupy all available space (e.g. the code editor).
  wizardField: 'flex flex-col gap-1.5 text-left',
  wizardFieldLabel: 'text-sm font-medium text-gray-700 dark:text-gray-300',
  wizardCounter: 'self-end text-xs text-gray-400 dark:text-gray-500',
  // Dots: inactive = small circle, active = elongated pill (smooth width transition)
  wizardSteps: 'flex items-center justify-center gap-3 pt-6',
  wizardStepDots: 'flex items-center justify-center gap-2',
  wizardStepDot:
    'h-2 w-2 rounded-full bg-gray-300 transition-all duration-200 hover:bg-gray-400 dark:bg-gray-300 dark:hover:bg-gray-200',
  wizardStepDotActive: 'w-6 bg-gray-900 hover:bg-gray-900 dark:bg-gray-100 dark:hover:bg-gray-100',
  // Prev/next helpers flanking the dots.
  wizardStepArrow:
    'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-gray-800 dark:hover:text-gray-200',
  wizardStepArrowIcon: 'h-4 w-4',
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
    'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200',
  toastError:
    'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200',
  // Capability banner (e.g. "Allow User Scripts" not enabled yet)
  banner:
    'mx-6 mt-8 flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left dark:border-gray-800 dark:bg-gray-800/50',
  bannerIcon: 'h-5 w-5 flex-shrink-0 text-cyan-600 dark:text-cyan-400',
  bannerText: 'flex flex-col gap-0.5',
  bannerTitle: 'text-sm font-semibold text-gray-900 dark:text-gray-100',
  bannerDescription: 'text-xs text-gray-600 dark:text-gray-400',
  // Code editor (CodeMirror mounts here; its own theme mirrors these colors)
  codeEditor: 'h-full min-h-[16rem] w-full overflow-hidden rounded-xl border border-gray-200 text-sm dark:border-gray-800',
  // Wraps the code editor so the floating action buttons (clear, AI) can overlay its bottom-right corner.
  codeEditorWrapper: 'relative min-h-0 w-full flex-1',
  codeEditorActions: 'absolute bottom-3 right-6 z-10 flex items-center gap-1.5',
  codeEditorActionButton:
    'flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm ring-1 ring-gray-200 backdrop-blur transition-colors hover:bg-white hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-800/90 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200',
  codeEditorActionButtonDanger:
    'flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm ring-1 ring-gray-200 backdrop-blur transition-colors hover:bg-rose-50 dark:bg-gray-800/90 dark:ring-gray-700 dark:hover:bg-rose-950',
  codeEditorActionIcon: 'h-4 w-4',
  codeEditorTestButton:
    'flex h-8 items-center justify-center rounded-full bg-cyan-600 px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-cyan-500 dark:hover:bg-cyan-400',
  // Step 4: two columns — chat with the LLM on the left, code editor at full height on the right.
  // Fixed viewport-relative height: decoupled from the ancestor flex/grid
  // chain entirely (percentage heights there kept silently resolving to
  // "auto" through some link, letting content grow past its box no matter
  // how many min-h-0/overflow-hidden safety nets were added up the chain).
  wizardChatGrid: 'grid h-[64vh] w-full grid-cols-[1fr_2fr] gap-6 overflow-hidden',
  wizardChatColumn:
    'flex h-full min-h-0 flex-col gap-3 overflow-hidden rounded-tool border border-gray-200 p-4 text-left dark:border-gray-800',
  wizardChatHeader: 'flex flex-col gap-1 pb-1',
  wizardChatTitle: 'text-lg font-semibold text-gray-900 dark:text-gray-100',
  wizardChatSubtitle: 'text-xs text-gray-500 dark:text-gray-400',
  wizardChatMessages: 'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1 [scrollbar-gutter:stable]',
  wizardChatEmpty: 'flex flex-1 items-center justify-center px-4 text-center text-xs text-gray-400 dark:text-gray-500',
  wizardChatBubbleUser:
    'max-w-[85%] flex-shrink-0 break-words self-end rounded-2xl rounded-br-sm bg-cyan-600 px-3.5 py-2 text-sm text-white',
  wizardChatBubbleAssistant:
    'max-w-[85%] flex-shrink-0 break-words self-start rounded-2xl rounded-bl-sm bg-gray-100 px-3.5 py-2 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  wizardChatInputWrapper: 'relative w-full flex-shrink-0',
  wizardChatInput:
    'h-16 w-full resize-none rounded-tool border border-gray-300 bg-white py-2 pl-3 pr-12 text-sm text-gray-900 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500',
  wizardChatSendButton:
    'absolute bottom-2.5 right-5 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-600 text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-cyan-500 dark:hover:bg-cyan-400',
  wizardChatEditorColumn: 'relative h-full min-h-0 w-full overflow-hidden text-left',
  // Tester step: message centered, Save centered below it once the test passes.
  wizardTesterBody: 'flex w-full flex-col items-center gap-6 text-center',
  // Processing animation: a spinning ring around a pulsing icon.
  wizardTesterSpinnerWrapper: 'relative flex h-16 w-16 items-center justify-center',
  wizardTesterSpinnerTrack: 'absolute inset-0 rounded-full border-4 border-cyan-100 dark:border-cyan-950',
  wizardTesterSpinnerArc:
    'absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-cyan-500 dark:border-t-cyan-400',
  wizardTesterSpinnerIcon: 'h-6 w-6 animate-pulse text-cyan-500 dark:text-cyan-400',
  testStatusWaiting: 'text-lg font-semibold text-gray-500 dark:text-gray-400',
  testStatusOk: 'text-lg font-semibold text-emerald-600 dark:text-emerald-400',
  testStatusError: 'text-lg font-semibold text-rose-600 dark:text-rose-400',
  wizardTesterActions: 'flex items-center gap-3',
  // Generic modal: dim overlay + centered panel, reused by the LLM config popup.
  modalOverlay: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6',
  modalPanel: 'flex w-full max-w-md flex-col gap-5 rounded-tool bg-white p-6 text-left shadow-xl dark:bg-gray-900',
  modalHeader: 'flex items-center justify-between',
  modalTitle: 'text-lg font-semibold text-gray-900 dark:text-gray-100',
  modalActions: 'flex items-center justify-end gap-3',
  modalStatusOk: 'break-words text-sm font-medium text-emerald-600 dark:text-emerald-400',
  modalStatusError: 'break-words text-sm font-medium text-rose-600 dark:text-rose-400',
} as const

export type UiVariant = keyof typeof ui
