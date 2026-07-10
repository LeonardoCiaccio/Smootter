/**
 * Data collected across the wizard steps.
 * Only the fields used by built steps exist; future steps (scope) add their
 * own fields here once implemented.
 */

/**
 * When the tool runs:
 * - manual: on demand, no page needed (e.g. summarize a document)
 * - pageStart: as the page starts loading (Chrome's document_start)
 * - pageIdle: once the page has fully loaded (Chrome's document_idle)
 */
export type WizardTrigger = 'manual' | 'pageStart' | 'pageIdle'

export class WizardData {
  name = ''
  description = ''
  trigger: WizardTrigger | null = 'manual'
}
