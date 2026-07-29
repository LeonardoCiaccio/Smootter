/**
 * importFlow the single entry point every import trigger goes through (toolbar button,
 * app-wide drag & drop). Module-level singleton (same pattern as toast.ts): parses the
 * files, and either applies directly (plain tools-only file) or holds the parsed result in
 * `pendingImport` for ImportConfirmModal.vue (mounted once in App.vue) to resolve.
 */
import { ref } from 'vue'
import {
  applyParsedImport,
  needsImportConfirmation,
  parseImportFiles,
  type ImportSelection,
  type ParsedImport,
} from '@/shared/exportImport'
import { useToast } from '../plugins/toast'
import { notifyToolsChanged } from './toolsRefresh'
import { notifyBookmarkletsChanged } from './bookmarkletsRefresh'
import { notifyReplacerChanged } from './replacerRefresh'
import { showLlmApiKeyReminder } from './llmApiKeyReminder'

const toast = useToast()

export const pendingImport = ref<ParsedImport | null>(null)

async function finishImport(parsed: ParsedImport, selection: ImportSelection): Promise<void> {
  // An unhandled rejection here (a DB write failing, say) must never silently swallow the whole
  // import: without this, a partial save left the user thinking nothing happened at all, with no
  // error and no fresh data (see bookmarkletsDb.saveFavicon's clone-safety fix, found this way).
  let result: Awaited<ReturnType<typeof applyParsedImport>>
  try {
    result = await applyParsedImport(parsed, selection)
  } catch (error) {
    toast.error(chrome.i18n.getMessage('toolsImportError'))
    console.error('[Smootter] import failed:', error)
    return
  }

  const { toolsImported, bookmarkletsImported, replacersImported, llmConfigNeedsApiKey } = result
  if (toolsImported > 0) notifyToolsChanged()
  if (bookmarkletsImported > 0) notifyBookmarkletsChanged()
  if (replacersImported > 0) notifyReplacerChanged()
  // llmConfig/networkConfig/smootterServices need no signal here: their Options sections each
  // listen to chrome.storage.onChanged directly (see useLlmConfigForm.ts,
  // NetworkSettingsSection.vue), which fires regardless of which context wrote the change.

  const imported = toolsImported + bookmarkletsImported + replacersImported
  if (imported > 0) toast.success(chrome.i18n.getMessage('toolsImportSuccess', [String(imported)]))
  if (parsed.failed > 0) toast.error(chrome.i18n.getMessage('toolsImportError'))
  if (llmConfigNeedsApiKey) showLlmApiKeyReminder()
}

/** Called by the confirmation modal's "import" button. */
export function confirmImport(selection: ImportSelection): void {
  if (!pendingImport.value) return
  void finishImport(pendingImport.value, selection)
  pendingImport.value = null
}

export function cancelImport(): void {
  pendingImport.value = null
}

/** Entry point for every import trigger. */
export async function startImport(files: File[]): Promise<void> {
  if (files.length === 0) return

  const parsed = await parseImportFiles(files)
  if (
    parsed.tools.length === 0 &&
    parsed.bookmarkletCandidates.length === 0 &&
    parsed.replacerCandidates.length === 0 &&
    parsed.llmConfig === null &&
    parsed.networkConfig === null &&
    parsed.smootterServices === null
  ) {
    if (parsed.failed > 0) toast.error(chrome.i18n.getMessage('toolsImportError'))
    return
  }

  if (needsImportConfirmation(parsed)) {
    pendingImport.value = parsed
    return
  }

  await finishImport(parsed, {
    tools: true,
    bookmarklets: true,
    replacers: true,
    llmConfig: true,
    networkConfig: true,
    smootterServices: true,
  })
}
