/**
 * exportImport — the app's two general export/import actions (toolbar buttons, and drag &
 * drop anywhere in the app): one file, tools and bookmarklets together. Import is split into
 * parse (parseImportFiles — reads every file, saves nothing) and apply (applyParsedImport —
 * actually writes the selected sections) so the caller can show a confirmation step in
 * between for anything beyond a plain tools-only file (see needsImportConfirmation).
 */
import { getAllTools, saveTool, type StoredTool } from './toolsDb'
import { getAllBookmarklets, getAllCategories } from './bookmarkletsDb'
import { downloadJson, parseToolsValue, toolToExportable } from './toolsTransfer'
import {
  bookmarkletToExportable,
  parseBookmarkletsValue,
  saveImportedBookmarklets,
  type BookmarkletImportCandidate,
} from './bookmarkletsTransfer'
import { getPreference, setPreference, type NetworkConfig } from './preferences'
import { isLocalLlmEndpoint } from './llmEndpoint'

interface Bundle {
  tools?: unknown
  bookmarklets?: unknown
  llmConfig?: unknown
  networkConfig?: unknown
}

function isBundle(value: unknown): value is Bundle {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && ('tools' in value || 'bookmarklets' in value)
}

/** The LLM connection settings minus the API key — never exported, never carried by an import. */
export interface ExportedLlmConfig {
  endpoint: string
  model: string
  maxOutputTokens: number
}

/** Minimal shape check — never trust a hand-edited or foreign export file blindly. */
function isExportedLlmConfig(value: unknown): value is ExportedLlmConfig {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.endpoint === 'string' &&
    typeof record.model === 'string' &&
    typeof record.maxOutputTokens === 'number' &&
    Number.isInteger(record.maxOutputTokens) &&
    record.maxOutputTokens >= 1
  )
}

function isNetworkConfig(value: unknown): value is NetworkConfig {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.minSizeBytes === 'number' && Number.isInteger(record.minSizeBytes) && record.minSizeBytes >= 0
}

/**
 * Includes the LLM connection settings — endpoint, model, max tokens — but never the API key:
 * that stays local to this device/browser and is never written to the exported file.
 */
export async function exportEverything(): Promise<void> {
  const [tools, bookmarklets, categories, llmConfig, networkConfig] = await Promise.all([
    getAllTools(),
    getAllBookmarklets(),
    getAllCategories(),
    getPreference('llmConfig'),
    getPreference('networkConfig'),
  ])

  const exportedLlmConfig: ExportedLlmConfig | undefined = llmConfig
    ? { endpoint: llmConfig.endpoint, model: llmConfig.model, maxOutputTokens: llmConfig.maxOutputTokens }
    : undefined

  downloadJson(`smootter-export-${new Date().toISOString().slice(0, 10)}.json`, {
    tools: tools.map(toolToExportable),
    bookmarklets: bookmarklets.map((bookmarklet) => bookmarkletToExportable(bookmarklet, categories)),
    llmConfig: exportedLlmConfig,
    networkConfig,
  })
}

export interface ParsedImport {
  tools: StoredTool[]
  bookmarkletCandidates: BookmarkletImportCandidate[]
  llmConfig: ExportedLlmConfig | null
  networkConfig: NetworkConfig | null
  /** Files (or bundle sections) that failed to parse — reported once, upfront. */
  failed: number
}

/** Reads and normalizes every file — saves nothing yet. */
export async function parseImportFiles(files: File[]): Promise<ParsedImport> {
  const tools: StoredTool[] = []
  const bookmarkletCandidates: BookmarkletImportCandidate[] = []
  let llmConfig: ExportedLlmConfig | null = null
  let networkConfig: NetworkConfig | null = null
  let failed = 0

  for (const file of files) {
    try {
      const parsed: unknown = JSON.parse(await file.text())

      if (isBundle(parsed)) {
        // Each section is independent — an empty array is legitimate (nothing of that kind
        // yet), and a problem in one section must never prevent the others from parsing.
        if (parsed.tools !== undefined && !(Array.isArray(parsed.tools) && parsed.tools.length === 0)) {
          try {
            tools.push(...parseToolsValue(parsed.tools))
          } catch {
            failed++
          }
        }
        if (parsed.bookmarklets !== undefined && !(Array.isArray(parsed.bookmarklets) && parsed.bookmarklets.length === 0)) {
          try {
            bookmarkletCandidates.push(...parseBookmarkletsValue(parsed.bookmarklets))
          } catch {
            failed++
          }
        }
        if (isExportedLlmConfig(parsed.llmConfig)) llmConfig = parsed.llmConfig
        if (isNetworkConfig(parsed.networkConfig)) networkConfig = parsed.networkConfig
        continue
      }

      // Legacy shape: a bare tool or array of tools, from before bookmarklets existed.
      tools.push(...parseToolsValue(parsed))
    } catch {
      failed++
    }
  }

  return { tools, bookmarkletCandidates, llmConfig, networkConfig, failed }
}

/** A file that's just tools — the common case — skips the confirmation step entirely. */
export function needsImportConfirmation(parsed: ParsedImport): boolean {
  return parsed.bookmarkletCandidates.length > 0 || parsed.llmConfig !== null || parsed.networkConfig !== null
}

export interface ImportSelection {
  tools: boolean
  bookmarklets: boolean
  llmConfig: boolean
  networkConfig: boolean
}

export interface ImportSummary {
  toolsImported: number
  bookmarkletsImported: number
  llmConfigImported: boolean
  // True when the imported endpoint isn't a local runtime (Ollama, LM Studio, ...) — those
  // need an API key, which imports never carry, so the caller should prompt for one.
  llmConfigNeedsApiKey: boolean
  networkConfigImported: boolean
}

/** Saves whichever sections `selection` keeps, from an already-parsed import. */
export async function applyParsedImport(parsed: ParsedImport, selection: ImportSelection): Promise<ImportSummary> {
  let toolsImported = 0
  let bookmarkletsImported = 0
  let llmConfigImported = false
  let llmConfigNeedsApiKey = false
  let networkConfigImported = false

  if (selection.tools && parsed.tools.length > 0) {
    for (const tool of parsed.tools) await saveTool(tool)
    toolsImported = parsed.tools.length
  }

  if (selection.bookmarklets && parsed.bookmarkletCandidates.length > 0) {
    const categoryCache = new Map((await getAllCategories()).map((category) => [category.name, category]))
    const bookmarkletsByUrl = new Map((await getAllBookmarklets()).map((bookmarklet) => [bookmarklet.url, bookmarklet]))
    bookmarkletsImported = await saveImportedBookmarklets(parsed.bookmarkletCandidates, categoryCache, bookmarkletsByUrl)
  }

  if (selection.llmConfig && parsed.llmConfig) {
    // New endpoint/model likely need a different key — always cleared, the user re-enters it.
    await setPreference('llmConfig', { ...parsed.llmConfig, apiKey: '' })
    llmConfigImported = true
    if (!isLocalLlmEndpoint(parsed.llmConfig.endpoint)) llmConfigNeedsApiKey = true
  }

  if (selection.networkConfig && parsed.networkConfig) {
    await setPreference('networkConfig', parsed.networkConfig)
    networkConfigImported = true
  }

  return { toolsImported, bookmarkletsImported, llmConfigImported, llmConfigNeedsApiKey, networkConfigImported }
}
