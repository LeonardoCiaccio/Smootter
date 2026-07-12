/**
 * exportImport — the app's two general export/import actions (toolbar buttons, and the
 * Home drop zone): one file, tools and bookmarklets together. Delegates the actual
 * parsing/normalizing to toolsTransfer.ts and bookmarkletsTransfer.ts; this module only
 * owns the combined file shape and the fallback for older, tools-only exported files
 * (from before bookmarklets existed).
 */
import { getAllTools, saveTool } from './toolsDb'
import { getAllBookmarklets, getAllCategories } from './bookmarkletsDb'
import { downloadJson, parseToolsValue, toolToExportable } from './toolsTransfer'
import { bookmarkletToExportable, parseBookmarkletsValue, saveImportedBookmarklets } from './bookmarkletsTransfer'
import { getPreference, setPreference } from './preferences'
import { isLocalLlmEndpoint } from './llmEndpoint'

interface Bundle {
  tools?: unknown
  bookmarklets?: unknown
  llmConfig?: unknown
}

function isBundle(value: unknown): value is Bundle {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && ('tools' in value || 'bookmarklets' in value)
}

/** The LLM connection settings minus the API key — never exported, never carried by an import. */
interface ExportedLlmConfig {
  endpoint: string
  model: string
  maxOutputTokens: number
}

/** Minimal shape check — never trust a hand-edited or foreign export file blindly. */
function isExportedLlmConfig(value: unknown): value is ExportedLlmConfig {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.endpoint === 'string' && typeof record.model === 'string' && typeof record.maxOutputTokens === 'number'
}

/**
 * Includes the LLM connection settings — endpoint, model, max tokens — but never the API key:
 * that stays local to this device/browser and is never written to the exported file.
 */
export async function exportEverything(): Promise<void> {
  const [tools, bookmarklets, categories, llmConfig] = await Promise.all([
    getAllTools(),
    getAllBookmarklets(),
    getAllCategories(),
    getPreference('llmConfig'),
  ])

  const exportedLlmConfig: ExportedLlmConfig | undefined = llmConfig
    ? { endpoint: llmConfig.endpoint, model: llmConfig.model, maxOutputTokens: llmConfig.maxOutputTokens }
    : undefined

  downloadJson(`smootter-export-${new Date().toISOString().slice(0, 10)}.json`, {
    tools: tools.map(toolToExportable),
    bookmarklets: bookmarklets.map((bookmarklet) => bookmarkletToExportable(bookmarklet, categories)),
    llmConfig: exportedLlmConfig,
  })
}

export interface ImportSummary {
  toolsImported: number
  bookmarkletsImported: number
  llmConfigImported: boolean
  // True when the imported endpoint isn't a local runtime (Ollama, LM Studio, ...) — those
  // need an API key, which imports never carry, so the caller should prompt for one.
  llmConfigNeedsApiKey: boolean
  failed: number
}

/** Parses and saves every file (toolbar file picker or a drop), tallying failures per file. */
export async function importEverythingFromFiles(files: File[]): Promise<ImportSummary> {
  let toolsImported = 0
  let bookmarkletsImported = 0
  let llmConfigImported = false
  let llmConfigNeedsApiKey = false
  let failed = 0

  // Shared across the whole batch so newly created categories / just-updated bookmarklets
  // stay consistent across multiple files in the same import.
  const categoryCache = new Map((await getAllCategories()).map((category) => [category.name, category]))
  const bookmarkletsByUrl = new Map((await getAllBookmarklets()).map((bookmarklet) => [bookmarklet.url, bookmarklet]))

  for (const file of files) {
    try {
      const parsed: unknown = JSON.parse(await file.text())

      if (isBundle(parsed)) {
        if (parsed.tools !== undefined) {
          const tools = parseToolsValue(parsed.tools)
          for (const tool of tools) await saveTool(tool)
          toolsImported += tools.length
        }
        if (parsed.bookmarklets !== undefined) {
          const candidates = parseBookmarkletsValue(parsed.bookmarklets)
          bookmarkletsImported += await saveImportedBookmarklets(candidates, categoryCache, bookmarkletsByUrl)
        }
        if (isExportedLlmConfig(parsed.llmConfig)) {
          // New endpoint/model likely need a different key — always cleared, the user re-enters it.
          await setPreference('llmConfig', { ...parsed.llmConfig, apiKey: '' })
          llmConfigImported = true
          if (!isLocalLlmEndpoint(parsed.llmConfig.endpoint)) llmConfigNeedsApiKey = true
        }
        continue
      }

      // Legacy shape: a bare tool or array of tools, from before bookmarklets existed.
      const tools = parseToolsValue(parsed)
      for (const tool of tools) await saveTool(tool)
      toolsImported += tools.length
    } catch {
      failed++
    }
  }

  return { toolsImported, bookmarkletsImported, llmConfigImported, llmConfigNeedsApiKey, failed }
}
