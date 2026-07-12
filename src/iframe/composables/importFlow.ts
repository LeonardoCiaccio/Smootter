/**
 * importFlow — the single entry point every import trigger goes through (toolbar button,
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
import { showLlmApiKeyReminder } from './llmApiKeyReminder'

const toast = useToast()

export const pendingImport = ref<ParsedImport | null>(null)

async function finishImport(parsed: ParsedImport, selection: ImportSelection): Promise<void> {
  const { toolsImported, bookmarkletsImported, llmConfigNeedsApiKey } = await applyParsedImport(parsed, selection)
  if (toolsImported > 0) notifyToolsChanged()
  if (bookmarkletsImported > 0) notifyBookmarkletsChanged()

  const imported = toolsImported + bookmarkletsImported
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
  if (parsed.tools.length === 0 && parsed.bookmarkletCandidates.length === 0 && parsed.llmConfig === null && parsed.networkConfig === null) {
    if (parsed.failed > 0) toast.error(chrome.i18n.getMessage('toolsImportError'))
    return
  }

  if (needsImportConfirmation(parsed)) {
    pendingImport.value = parsed
    return
  }

  await finishImport(parsed, { tools: true, bookmarklets: true, llmConfig: true, networkConfig: true })
}
