/**
 * Data collected across the wizard steps.
 * Only the fields used by built steps exist; future steps add their own
 * fields here once implemented.
 */
import { capChatMessages, type ChatMessage } from '@/shared/messages'
import type { StoredTool } from '@/shared/toolsDb'

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
  // Set when editing a saved tool (loaded from the DB) Save then updates
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
  // New tools start enabled; editing a saved tool preserves its current state.
  enabled = true
  // The step 4 chat: full conversation with the LLM, sent as context on every turn.
  chatMessages: ChatMessage[] = []
}

/** Builds the record to persist, shared by the tester step (test-then-save) and quick save (edit mode). */
export function toStoredTool(data: WizardData): StoredTool {
  return {
    id: data.id ?? crypto.randomUUID(),
    name: data.name,
    description: data.description,
    trigger: data.trigger ?? 'pageStart',
    scope: data.scope,
    scopeTargets: data.scopeTargets,
    code: data.code,
    enabled: data.enabled,
    chatMessages: capChatMessages(data.chatMessages),
    createdAt: data.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  }
}
