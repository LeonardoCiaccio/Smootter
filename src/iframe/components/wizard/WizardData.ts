/**
 * Data collected across the wizard steps.
 * Only the fields used by built steps exist; future steps add their own
 * fields here once implemented.
 */

/**
 * When the tool runs:
 * - pageStart: as the page starts loading (Chrome's document_start)
 * - pageIdle: once the page has fully loaded (Chrome's document_idle)
 */
export type WizardTrigger = 'pageStart' | 'pageIdle'

/**
 * Where the tool runs:
 * - everywhere: any site
 * - domain: only the domains/pages listed in scopeTargets
 */
export type WizardScope = 'everywhere' | 'domain'

export class WizardData {
  // Set when editing a saved tool (loaded from the DB) — Save then updates
  // that same record (same id and original createdAt) instead of creating a new one.
  id: string | null = null
  createdAt: number | null = null
  name = ''
  description = ''
  trigger: WizardTrigger | null = 'pageStart'
  scope: WizardScope = 'everywhere'
  scopeTargets = ''
  code = ''
  // Reset to false whenever code changes; Save is gated on this being true.
  codeTested = false
}
