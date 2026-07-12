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
  // App shell: toolbar (top) + boxed content row (middle, flex-1) + footer (bottom).
  // isolate: contains the glow's negative z-index to this stacking context, so it can't
  // escape past appShell's own background and get painted over by it.
  appShell: 'relative isolate flex h-full w-full flex-col bg-white dark:bg-gray-900',
  // 3-column boxed layout: empty side columns, app content in the center (max-w-7xl = 1280px)
  layoutRoot: 'flex w-full min-h-0 flex-1',
  layoutSide: 'flex-1 h-full',
  layoutCenter: 'relative w-full max-w-7xl h-full overflow-hidden',
  // Toolbar: app info (left) · built-in accessory tools (center) · actions (right)
  toolbar: 'grid flex-shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-4',
  toolbarAppInfo: 'flex items-center gap-2 justify-self-start text-gray-900 dark:text-gray-100',
  toolbarLogo: 'h-5 w-5',
  toolbarAppName: 'text-sm font-semibold',
  toolbarAppVersion: 'text-xs opacity-60',
  toolbarAccessories: 'flex items-center gap-2 justify-self-center',
  // Accessory tools stand out from the plain-gray actions on the right: bigger, accent-colored.
  toolbarAccessoryButton:
    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-cyan-600 transition-colors hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-950',
  toolbarAccessoryIcon: 'h-6 w-6',
  toolbarActions: 'flex items-center gap-2 justify-self-end',
  toolbarIconButton:
    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
  // Separates the export/import pair from the theme/options/close group.
  toolbarDivider: 'mx-1 h-4 w-px flex-shrink-0 bg-gray-200 dark:bg-gray-800',
  toolbarHiddenFileInput: 'hidden',
  toolbarCloseButton:
    'ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
  toolbarIcon: 'h-4 w-4',
  // Footer: general info (copyright, version)
  footer: 'flex-shrink-0 px-5 py-2.5 text-center text-[11px] text-gray-400 dark:text-gray-500',
  statusText: 'text-lg font-semibold text-gray-900 dark:text-gray-100',
  homeShell: 'flex flex-col',
  // Shown while dragging a file over the home area, to import it as a tool.
  toolsDropOverlay:
    'pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-white/90 dark:bg-gray-900/90',
  toolsDropOverlayIcon: 'h-10 w-10 text-cyan-600 dark:text-cyan-400',
  toolsDropOverlayText: 'text-sm font-medium text-gray-700 dark:text-gray-300',
  // Decorative blurred blobs behind the whole app (all views) — fixed to appShell's own box,
  // so nothing (like layoutCenter's overflow-hidden) can clip the blur bleed.
  heroGlow: 'pointer-events-none absolute inset-0 -z-10',
  heroGlowBlobA:
    'absolute left-10 -top-10 h-64 w-64 rounded-full bg-violet-500 opacity-20 blur-3xl dark:opacity-25',
  heroGlowBlobB:
    'absolute right-10 top-6 h-56 w-56 rounded-full bg-cyan-400 opacity-20 blur-3xl dark:opacity-20',
  heroGlowBlobC:
    'absolute left-1/3 top-72 h-56 w-56 rounded-full bg-fuchsia-400 opacity-10 blur-3xl dark:opacity-15',
  // Home hero: pushed toward the top (the toolbar above is a normal in-flow element now)
  heroWrapper: 'flex flex-col items-center gap-4 px-6 pt-20 text-center',
  heroHeader:
    'font-heading bg-gradient-to-r from-violet-600 to-cyan-400 bg-clip-text pb-1 text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl',
  heroSubheader: 'font-subheading max-w-md text-base text-gray-600 dark:text-gray-400',
  // Tools panel: empty state, illustration + plain icon/label (icon follows text color via currentColor).
  toolsPanel: 'mt-16 flex flex-col items-center',
  toolsEmptyWrapper: 'flex flex-col items-center gap-6',
  toolsEmptyIllustration: 'h-72 w-72 opacity-90',
  toolsEmptyButton:
    'inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
  toolsEmptyIcon: 'h-5 w-5',
  // Search (only shown past a tool count threshold): sits above the scroll area, never scrolls away with it.
  toolsSearchWrapper: 'relative mb-6 w-full max-w-sm flex-shrink-0',
  toolsSearchInput:
    'w-full rounded-full border border-gray-300 bg-white py-2 pl-9 pr-8 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500',
  toolsSearchIcon:
    'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500',
  toolsSearchClear:
    'absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200',
  toolsSearchClearIcon: 'h-3.5 w-3.5',
  toolsNoResults: 'w-full py-10 text-center text-sm text-gray-400 dark:text-gray-500',
  // Fixed vh height + its own scroll — a percentage-height chain up through the app shell
  // doesn't reliably contain this content, so it's sized independently instead (like the wizard chat grid).
  toolsScrollArea:
    'flex max-h-[58vh] w-full justify-center overflow-y-auto px-6 pb-10 [scrollbar-gutter:stable]',
  // Saved tools: 4-column grid, one card per tool (whole card is the click target)
  toolsList: 'grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4',
  toolCard:
    'group relative flex h-32 w-full flex-col gap-1 rounded-tool border border-gray-200 p-4 text-left transition-colors hover:border-cyan-500 dark:border-gray-800 dark:hover:border-cyan-400',
  toolCardTitle: 'truncate pr-20 text-sm font-semibold text-gray-900 dark:text-gray-100',
  toolCardDescription: 'line-clamp-2 flex-1 text-xs text-gray-500 dark:text-gray-400',
  toolCardMetaRow: 'flex items-center justify-between gap-2',
  toolCardMeta: 'min-w-0 flex-1 truncate text-[11px] text-gray-400 dark:text-gray-500',
  // Enable/disable switch, right after the dates.
  switchTrack:
    'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors',
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
  // Bookmarklets: empty state is just the centered form; once there's at least one category
  // or bookmarklet, a sidebar appears alongside a main area (detail or, by default, the form).
  bookmarkletsWrapper:
    'mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 overflow-y-auto px-6 pb-10 pt-10',
  bookmarkletsHeaderGroup: 'mb-2 flex flex-col gap-1.5',
  bookmarkletsHeader: 'font-heading text-2xl font-bold text-gray-900 dark:text-gray-100',
  bookmarkletsSubheader: 'font-subheading text-sm text-gray-500 dark:text-gray-400 pb-4',
  bookmarkletsForm: 'flex flex-col gap-4',
  bookmarkletsFormActions: 'flex items-center justify-end gap-2',
  bookmarkletsTitleRow: 'flex items-center gap-2',
  bookmarkletsFavicon:
    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-tool border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800',
  bookmarkletsFaviconImage: 'h-4 w-4',
  bookmarkletsFaviconFallback: 'h-4 w-4 text-gray-400 dark:text-gray-500',
  bookmarkletsAlreadySavedNotice:
    'mb-4 rounded-tool border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-300',
  bookmarkletsLayout: 'flex min-h-0 flex-1',
  bookmarkletsSidebar:
    'flex w-56 flex-shrink-0 flex-col gap-4 overflow-y-auto border-r border-gray-200 px-4 pb-6 pt-10 dark:border-gray-800',
  bookmarkletsSidebarHeader: 'flex items-center justify-between',
  bookmarkletsSidebarHeaderActions: 'flex items-center gap-1',
  bookmarkletsSidebarTitle:
    'text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500',
  bookmarkletsCategoryGroup: 'flex flex-col gap-0.5',
  // Category header: distinct from items on purpose — bold, dark, its own row with a folder icon
  // and a chevron that rotates to show collapsed/expanded state.
  bookmarkletsCategoryHeader:
    'flex min-w-0 flex-1 items-center gap-1.5 rounded-tool px-1 py-1.5 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
  // Shown while dragging a bookmarklet over a real category — a ring, not a background swap,
  // so it stays visible over the hover background too.
  bookmarkletsCategoryHeaderDropTarget: 'ring-2 ring-cyan-500',
  bookmarkletsCategoryChevron:
    'h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition-transform dark:text-gray-500',
  bookmarkletsCategoryChevronOpen: 'rotate-90',
  bookmarkletsCategoryIcon: 'h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400',
  bookmarkletsCategoryName: 'truncate text-sm font-semibold text-gray-900 dark:text-gray-100',
  bookmarkletsSidebarRow: 'group flex items-center',
  // Action icons only earn their place on hover — collapsed to zero width the rest of the
  // time (not just opacity-0), so the title gets the full row width instead of always leaving
  // room for buttons nobody's looking at.
  bookmarkletsRowActionButton:
    'flex h-6 w-0 flex-shrink-0 items-center justify-center overflow-hidden rounded-tool text-gray-400 opacity-0 transition-all group-hover:ml-1 group-hover:w-6 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200',
  bookmarkletsRowActionButtonDeleteConfirm:
    'flex h-6 w-0 flex-shrink-0 items-center justify-center overflow-hidden rounded-tool text-rose-500 opacity-0 transition-all group-hover:ml-1 group-hover:w-6 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-950',
  bookmarkletsSidebarItem:
    'flex min-w-0 flex-1 items-center gap-1.5 rounded-tool py-1.5 pl-8 pr-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  bookmarkletsSidebarItemActive: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  bookmarkletsSidebarItemText: 'truncate',
  bookmarkletsSidebarItemFavicon: 'h-3.5 w-3.5 flex-shrink-0',
  bookmarkletsSidebarItemFaviconFallback:
    'h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500',
  bookmarkletsMain: 'flex flex-1 overflow-y-auto',
  // Right sidebar: every tag across all bookmarklets, deletable (strips it everywhere it's used).
  bookmarkletsTagsSidebar:
    'flex w-56 flex-shrink-0 flex-col gap-4 overflow-y-auto border-l border-gray-200 px-4 pb-6 pt-10 dark:border-gray-800',
  // Cloud layout: pills wrap and pack together instead of one per line.
  bookmarkletsTagsList: 'flex flex-wrap gap-1.5',
  bookmarkletsTagPill:
    'group flex max-w-full items-center gap-1 rounded-full border border-gray-300 py-1 pl-2.5 pr-1 transition-colors hover:border-cyan-500 dark:border-gray-700 dark:hover:border-cyan-400',
  bookmarkletsTagPillActive: 'border-cyan-500 bg-cyan-50 dark:border-cyan-400 dark:bg-cyan-950',
  bookmarkletsTagPillLabel: 'truncate text-xs text-gray-700 dark:text-gray-300',
  // The remove "x" only earns its place on hover — same reasoning as the row delete icons.
  bookmarkletsTagPillDelete:
    'flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full text-gray-400 opacity-0 transition-opacity hover:text-gray-700 group-hover:opacity-100 dark:hover:text-gray-200',
  bookmarkletsTagPillDeleteConfirm:
    'flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950',
  // Detailed results when a tag is clicked: a sorted, scannable list of every matching bookmarklet.
  bookmarkletsTagResultsHeader:
    'mb-6 font-heading text-xl font-bold text-gray-900 dark:text-gray-100',
  bookmarkletsTagResultsList: 'flex flex-col gap-3',
  bookmarkletsTagResultRecord:
    'flex cursor-pointer flex-col gap-1 rounded-tool border border-gray-200 p-4 text-left transition-colors hover:border-cyan-500 dark:border-gray-800 dark:hover:border-cyan-400',
  bookmarkletsTagResultCategory:
    'w-fit rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  bookmarkletsTagResultTopRow: 'flex items-center justify-between gap-2',
  bookmarkletsTagResultOpenButton:
    'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-tool text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200',
  bookmarkletsTagResultTitleRow: 'flex items-center gap-1.5',
  bookmarkletsTagResultTitle: 'truncate text-sm font-semibold text-gray-900 dark:text-gray-100',
  bookmarkletsTagResultDescription: 'text-xs text-gray-500 dark:text-gray-400',
  bookmarkletsTagResultTags: 'flex flex-wrap gap-1.5',
  bookmarkletsSearchRow: 'mb-6 flex items-center gap-2',
  bookmarkletsSearchInputWrapper: 'relative min-w-0 flex-1',
  bookmarkletsSearchInputIcon:
    'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500',
  bookmarkletsSearchInput:
    'w-full rounded-full border border-gray-300 bg-white py-2 pl-9 pr-8 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500',
  bookmarkletDetailLink: 'block truncate text-sm text-cyan-600 hover:underline dark:text-cyan-400',
  inputReadonly:
    'w-full truncate rounded-tool border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400',
  // Category combobox: a custom trigger+menu (native <select> can't be themed) plus a
  // compact "+" icon button that swaps in a name input.
  categoryCombobox: 'flex flex-col gap-1.5 text-left',
  categoryComboboxRow: 'flex items-center gap-2',
  categoryComboboxAnchor: 'relative min-w-0 flex-1',
  categoryComboboxTrigger:
    'flex w-full items-center justify-between gap-2 rounded-tool border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900 transition-colors hover:border-cyan-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-cyan-400',
  categoryComboboxTriggerText: 'truncate',
  categoryComboboxChevron: 'h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500',
  // Shared dropdown menu look — also used by the tag input's suggestion list.
  categoryComboboxMenu:
    'absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-tool border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800',
  categoryComboboxOption:
    'block w-full truncate px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
  categoryComboboxOptionActive: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  categoryAddButton:
    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-tool border border-gray-300 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
  // Tags: chip input with a themed custom suggestion dropdown (reuses the combobox menu look).
  tagsInputAnchor: 'relative',
  tagsInputWrapper:
    'flex flex-wrap items-center gap-1.5 rounded-tool border border-gray-300 bg-white px-2 py-1.5 focus-within:ring-2 focus-within:ring-cyan-500 dark:border-gray-700 dark:bg-gray-800',
  tagChip:
    'flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  tagChipRemove:
    'text-cyan-500 transition-colors hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-200',
  tagsInput:
    'min-w-[6rem] flex-1 border-none bg-transparent p-0.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 dark:text-gray-100',
  // Options: same two-pane shape as Bookmarklets/Network — sidebar picks one group,
  // isolating it in the main area instead of stacking every section at once.
  optionsLayout: 'flex min-h-0 flex-1',
  optionsSidebar:
    'flex w-56 flex-shrink-0 flex-col gap-1 overflow-y-auto border-r border-gray-200 px-4 pb-6 pt-10 dark:border-gray-800',
  optionsSidebarItem:
    'flex items-center gap-2 rounded-tool px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  optionsSidebarItemActive: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  optionsSidebarIcon: 'h-4 w-4 flex-shrink-0',
  optionsMain: 'flex flex-1 flex-col items-center overflow-y-auto px-8 py-10',
  optionsSection: 'flex w-full max-w-md flex-col gap-4 text-left',
  optionsSectionTitle: 'text-base font-semibold text-gray-900 dark:text-gray-100',
  optionsSectionDescription: 'text-xs text-gray-500 dark:text-gray-400 pb-2',
  optionsSectionActions: 'flex items-center justify-between gap-3',
  creditsList: 'flex flex-col divide-y divide-gray-100 dark:divide-gray-800',
  creditsItem: 'flex items-center justify-between py-2 text-sm',
  creditsLink:
    'text-gray-700 transition-colors hover:text-cyan-600 hover:underline dark:text-gray-300 dark:hover:text-cyan-400',
  creditsVersion: 'text-xs text-gray-400 dark:text-gray-500',
  breadcrumb: 'flex items-center gap-1.5 self-start px-6 pt-6 text-sm font-medium',
  breadcrumbHome:
    'text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
  breadcrumbSeparator: 'text-gray-300 dark:text-gray-600',
  breadcrumbCurrent: 'text-gray-900 dark:text-gray-100',
  // Quick save (edit mode only): styled as a breadcrumb segment, colored to stand out from the plain trail.
  breadcrumbSaveAction:
    'font-semibold text-cyan-600 transition-colors hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300',
  // Wizard viewport: centers the wizard both ways within the view
  wizardViewport: 'flex flex-1 items-center justify-center px-6 pb-6 pt-6',
  // Wizard: fixed 3-row layout (header / body / dots), 78% of the viewport height.
  // Width is split base/modifier (never combine two max-w-* at once — same class wins on cascade order, not attribute order).
  wizardWrapperBase: 'flex h-[78%] w-full flex-col items-center text-center',
  wizardWrapperWidth: 'max-w-xl',
  wizardWrapperWidthWide: 'max-w-none',
  wizardHeader: 'flex flex-col gap-1 pb-1',
  wizardTitle:
    'font-heading bg-gradient-to-r from-violet-600 to-cyan-400 bg-clip-text pb-1 text-3xl font-extrabold tracking-tight text-transparent',
  wizardSubtitle: 'font-subheading text-base text-gray-600 dark:text-gray-400',
  wizardBody:
    'flex w-full min-h-0 flex-1 flex-col justify-center overflow-y-auto pr-1 [scrollbar-gutter:stable]',
  wizardStepBody: 'flex w-full flex-col gap-4 text-left',
  // Fills the body instead of being centered — for steps whose content should occupy all available space (e.g. the code editor).
  wizardField: 'flex flex-col gap-1.5 text-left',
  wizardFieldLabel: 'text-sm font-medium text-gray-700 dark:text-gray-300',
  wizardCounter: 'self-end text-xs text-gray-400 dark:text-gray-500',
  wizardSteps: 'flex w-full items-start justify-center gap-3 pt-12',
  // Prev/next helpers flanking the stepper (nudged down to align with the circles, not the labels below them).
  wizardStepArrow:
    'mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-gray-800 dark:hover:text-gray-200',
  wizardStepArrowIcon: 'h-4 w-4',
  // Labeled stepper: numbered circles connected by a track, filled up to the current step
  // with the same cyan→violet gradient as the wizard title.
  wizardStepperWrapper: 'relative flex w-full max-w-sm items-start justify-between',
  wizardStepperTrack: 'absolute left-4 right-4 top-4 h-0.5 bg-gray-200 dark:bg-gray-800',
  wizardStepperTrackFill:
    'absolute left-4 top-4 h-0.5 bg-gradient-to-r from-cyan-500 to-violet-500 transition-[width] duration-300',
  wizardStepperButton: 'relative z-10 flex flex-col items-center gap-2 focus:outline-none',
  wizardStepperCircle:
    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
  wizardStepperCircleUpcoming:
    'border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-600',
  wizardStepperCircleActive:
    'border-cyan-500 bg-cyan-500 text-white shadow-[0_0_0_4px_rgba(6,182,212,0.15)] dark:shadow-[0_0_0_4px_rgba(34,211,238,0.2)]',
  wizardStepperCircleDone: 'border-cyan-500 bg-cyan-500 text-white',
  wizardStepperCircleIcon: 'h-4 w-4',
  wizardStepperLabel: 'text-[11px] font-medium transition-colors',
  wizardStepperLabelUpcoming: 'text-gray-400 dark:text-gray-600',
  wizardStepperLabelActive: 'text-gray-900 dark:text-gray-100',
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
  // Toast notifications: stacked bottom-right, one neutral card style — the variant colors
  // only the icon (plus a thin left accent), not the whole card. Calmer than a fully-tinted box.
  toastContainer:
    'pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-end gap-2 px-4 sm:inset-x-auto sm:right-4',
  toast:
    'pointer-events-auto flex max-w-sm items-start gap-2 rounded-xl border border-l-4 border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200',
  toastIcon: 'h-5 w-5 flex-shrink-0',
  toastInfo: 'border-l-sky-400 dark:border-l-sky-500 [&>svg]:text-sky-500 dark:[&>svg]:text-sky-400',
  toastSuccess: 'border-l-emerald-400 dark:border-l-emerald-500 [&>svg]:text-emerald-500 dark:[&>svg]:text-emerald-400',
  toastWarning: 'border-l-amber-400 dark:border-l-amber-500 [&>svg]:text-amber-500 dark:[&>svg]:text-amber-400',
  toastError: 'border-l-rose-400 dark:border-l-rose-500 [&>svg]:text-rose-500 dark:[&>svg]:text-rose-400',
  // Capability banner (e.g. "Allow User Scripts" not enabled yet)
  banner:
    'mx-6 mt-8 flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left dark:border-gray-800 dark:bg-gray-800/50',
  bannerIcon: 'h-5 w-5 flex-shrink-0 text-cyan-600 dark:text-cyan-400',
  bannerText: 'flex flex-col gap-0.5',
  bannerTitle: 'text-sm font-semibold text-gray-900 dark:text-gray-100',
  bannerDescription: 'text-xs text-gray-600 dark:text-gray-400',
  // Code editor (CodeMirror mounts here; its own theme mirrors these colors)
  codeEditor:
    'h-full min-h-[16rem] w-full overflow-hidden rounded-xl border border-gray-200 text-sm dark:border-gray-800',
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
  wizardChatTitle: 'font-heading font-extrabold text-lg text-gray-900 dark:text-gray-100',
  wizardChatSubtitle: 'font-sans text-xs text-gray-500 dark:text-gray-400',
  wizardChatMessages:
    'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1 [scrollbar-gutter:stable]',
  wizardChatEmpty:
    'flex flex-1 items-center justify-center px-4 text-center text-xs text-gray-400 dark:text-gray-500',
  wizardChatBubbleUser:
    'max-w-[85%] flex-shrink-0 break-words self-end rounded-2xl rounded-br-sm bg-cyan-600 px-3.5 py-2 text-sm text-white',
  wizardChatBubbleAssistant:
    'max-w-[85%] flex-shrink-0 break-words self-start rounded-2xl rounded-bl-sm bg-gray-100 px-3.5 py-2 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  wizardChatInputWrapper: 'relative w-full flex-shrink-0',
  wizardChatInput:
    'h-16 w-full resize-none rounded-tool border border-gray-300 bg-white py-2 pl-3 pr-12 text-sm text-gray-900 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500',
  wizardChatSendButton:
    'absolute right-5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-600 text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-cyan-500 dark:hover:bg-cyan-400',
  wizardChatEditorColumn: 'relative h-full min-h-0 w-full overflow-hidden text-left',
  // Tester step: message centered, Save centered below it once the test passes.
  wizardTesterBody: 'flex w-full flex-col items-center gap-6 text-center',
  // Processing animation: a spinning ring around a pulsing icon.
  wizardTesterSpinnerWrapper: 'relative flex h-16 w-16 items-center justify-center',
  wizardTesterSpinnerTrack:
    'absolute inset-0 rounded-full border-4 border-cyan-100 dark:border-cyan-950',
  wizardTesterSpinnerArc:
    'absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-cyan-500 dark:border-t-cyan-400',
  wizardTesterSpinnerIcon: 'h-6 w-6 animate-pulse text-cyan-500 dark:text-cyan-400',
  testStatusWaiting: 'text-lg font-semibold text-gray-500 dark:text-gray-400',
  testStatusOk: 'text-lg font-semibold text-emerald-600 dark:text-emerald-400',
  testStatusError: 'text-lg font-semibold text-rose-600 dark:text-rose-400',
  wizardTesterActions: 'flex items-center gap-3',
  // Generic modal: dim overlay + centered panel, reused by the LLM config popup.
  modalOverlay: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6',
  modalPanel:
    'flex w-full max-w-md flex-col gap-5 rounded-tool bg-white p-6 text-left shadow-xl dark:bg-gray-900',
  modalHeader: 'flex items-center justify-between',
  modalTitle: 'text-lg font-semibold text-gray-900 dark:text-gray-100',
  modalActions: 'flex items-center justify-end gap-3',
  modalBodyText: 'text-sm text-gray-600 dark:text-gray-400',
  importConfirmOption: 'flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300',
  importConfirmCheckbox:
    'h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 dark:border-gray-700 dark:bg-gray-800',
  modalStatusOk: 'break-words text-sm font-medium text-emerald-600 dark:text-emerald-400',
  modalStatusError: 'break-words text-sm font-medium text-rose-600 dark:text-rose-400',
  // Network inspector: left sidebar (fixed categories) + center scrollable log, same
  // two-pane shape as Bookmarklets but with its own tokens (independent, may diverge).
  networkLayout: 'flex min-h-0 flex-1',
  networkSidebar:
    'flex w-56 flex-shrink-0 flex-col gap-1 overflow-y-auto border-r border-gray-200 px-4 pb-6 pt-10 dark:border-gray-800',
  networkSidebarTitle:
    'mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500',
  networkCategoryButton:
    'flex items-center gap-2 rounded-tool px-2 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  networkCategoryButtonActive: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  networkCategoryIcon: 'h-4 w-4 flex-shrink-0',
  networkCategoryLabel: 'flex-1 truncate',
  networkCategoryCount: 'text-xs text-gray-400 dark:text-gray-500',
  networkMain: 'flex flex-1 flex-col overflow-y-auto px-6 pb-10 pt-10',
  networkSearchRow: 'mb-4 flex-shrink-0',
  networkSearchInputWrapper: 'relative min-w-0',
  networkSearchInputIcon:
    'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500',
  networkSearchInput:
    'w-full rounded-full border border-gray-300 bg-white py-2 pl-9 pr-8 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500',
  networkEmpty:
    'flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-gray-400 dark:text-gray-500',
  networkEmptyIcon: 'h-10 w-10 text-gray-300 dark:text-gray-700',
  networkList: 'flex flex-col gap-2',
  networkRow:
    'group flex items-center gap-3 rounded-tool border border-gray-200 p-3 text-left transition-colors hover:border-cyan-500 dark:border-gray-800 dark:hover:border-cyan-400',
  networkRowThumb:
    'flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-tool border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800',
  networkRowThumbImage: 'h-full w-full object-cover',
  networkRowThumbIcon: 'h-5 w-5 text-gray-400 dark:text-gray-500',
  networkRowBody: 'min-w-0 flex-1',
  networkRowUrl: 'truncate text-sm font-medium text-gray-900 dark:text-gray-100',
  networkRowMetaRow: 'flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500',
  networkRowMethod: 'font-semibold text-gray-500 dark:text-gray-400',
  networkRowStatusOk: 'font-semibold text-emerald-600 dark:text-emerald-400',
  networkRowStatusRedirect: 'font-semibold text-sky-600 dark:text-sky-400',
  networkRowStatusError: 'font-semibold text-rose-600 dark:text-rose-400',
  networkRowActions: 'flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100',
  networkRowActionButton:
    'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-tool text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200',
  networkRowActionIcon: 'h-4 w-4',
} as const

export type UiVariant = keyof typeof ui
