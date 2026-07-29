/**
 * exportImport the app's two general export/import actions (toolbar buttons, and drag &
 * drop anywhere in the app): one file, every section together. Import is split into parse
 * (parseImportFiles reads every file, saves nothing) and apply (applyParsedImport actually
 * writes the selected sections) so the caller can show a confirmation step in between for
 * anything beyond a plain tools-only file (see needsImportConfirmation).
 */
import { getAllTools, saveTool, type StoredTool } from './toolsDb'
import { getAllBookmarklets, getAllCategories, getAllFavicons, saveFavicon, type StoredFavicon } from './bookmarkletsDb'
import { getAllReplacers, getAllReplacerCategories } from './replacerDb'
import { downloadJson, parseToolsValue, toolToExportable } from './toolsTransfer'
import {
  bookmarkletToExportable,
  parseBookmarkletsValue,
  saveImportedBookmarklets,
  type BookmarkletImportCandidate,
} from './bookmarkletsTransfer'
import {
  replacerToExportable,
  parseReplacersValue,
  saveImportedReplacers,
  type ReplacerImportCandidate,
} from './replacerTransfer'
import {
  getPreference,
  setPreference,
  getSmootterServices,
  DEFAULT_SMOOTTER_SERVICES,
  type NetworkConfig,
  type SmootterServicesConfig,
} from './preferences'
import { isLocalLlmEndpoint } from './llmEndpoint'

interface Bundle {
  tools?: unknown
  bookmarklets?: unknown
  favicons?: unknown
  replacers?: unknown
  llmConfig?: unknown
  networkConfig?: unknown
  smootterServices?: unknown
}

function isBundle(value: unknown): value is Bundle {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    ('tools' in value || 'bookmarklets' in value || 'replacers' in value)
  )
}

/** The LLM connection settings minus the API key never exported, never carried by an import. */
export interface ExportedLlmConfig {
  endpoint: string
  model: string
  maxOutputTokens: number
}

/** Minimal shape check never trust a hand-edited or foreign export file blindly. */
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
  return (
    typeof record.minSizeBytes === 'number' &&
    Number.isInteger(record.minSizeBytes) &&
    record.minSizeBytes >= 0
  )
}

/** Minimal shape check for a cached favicon entry (see bookmarkletsDb's StoredFavicon). */
function isStoredFavicon(value: unknown): value is StoredFavicon {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.domain === 'string' && record.domain !== '' && typeof record.dataUrl === 'string'
}

/** Every key must be a boolean matches DEFAULT_SMOOTTER_SERVICES's shape exactly. */
function isSmootterServicesConfig(value: unknown): value is SmootterServicesConfig {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return Object.keys(DEFAULT_SMOOTTER_SERVICES).every((key) => typeof record[key] === 'boolean')
}

/**
 * Includes the LLM connection settings endpoint, model, max tokens but never the API key:
 * that stays local to this device/browser and is never written to the exported file. Includes
 * the actual on/off state of every Smootters toggle (resumer, replacer, ...) so an import
 * re-enables exactly what was enabled on export, not silently defaulting them back off.
 */
export async function exportEverything(): Promise<void> {
  const [tools, bookmarklets, bookmarkletCategories, favicons, replacers, replacerCategories, llmConfig, networkConfig, smootterServices] =
    await Promise.all([
      getAllTools(),
      getAllBookmarklets(),
      getAllCategories(),
      getAllFavicons(),
      getAllReplacers(),
      getAllReplacerCategories(),
      getPreference('llmConfig'),
      getPreference('networkConfig'),
      getSmootterServices(),
    ])

  const exportedLlmConfig: ExportedLlmConfig | undefined = llmConfig
    ? {
        endpoint: llmConfig.endpoint,
        model: llmConfig.model,
        maxOutputTokens: llmConfig.maxOutputTokens,
      }
    : undefined

  downloadJson(`smootter-export-${new Date().toISOString().slice(0, 10)}.json`, {
    tools: tools.map(toolToExportable),
    bookmarklets: bookmarklets.map((bookmarklet) =>
      bookmarkletToExportable(bookmarklet, bookmarkletCategories),
    ),
    favicons,
    replacers: replacers.map((replacer) => replacerToExportable(replacer, replacerCategories)),
    llmConfig: exportedLlmConfig,
    networkConfig,
    smootterServices,
  })
}

export interface ParsedImport {
  tools: StoredTool[]
  bookmarkletCandidates: BookmarkletImportCandidate[]
  // Favicons ride along with bookmarklets, not a separate user-facing selection: they're
  // meaningless without the bookmarklets they illustrate, so there's nothing to choose
  // independently see applyParsedImport, gated on selection.bookmarklets alone.
  favicons: StoredFavicon[]
  replacerCandidates: ReplacerImportCandidate[]
  llmConfig: ExportedLlmConfig | null
  networkConfig: NetworkConfig | null
  smootterServices: SmootterServicesConfig | null
  /** Files (or bundle sections) that failed to parse reported once, upfront. */
  failed: number
}

/** Reads and normalizes every file saves nothing yet. */
export async function parseImportFiles(files: File[]): Promise<ParsedImport> {
  const tools: StoredTool[] = []
  const bookmarkletCandidates: BookmarkletImportCandidate[] = []
  const favicons: StoredFavicon[] = []
  const replacerCandidates: ReplacerImportCandidate[] = []
  let llmConfig: ExportedLlmConfig | null = null
  let networkConfig: NetworkConfig | null = null
  let smootterServices: SmootterServicesConfig | null = null
  let failed = 0

  for (const file of files) {
    try {
      const parsed: unknown = JSON.parse(await file.text())

      if (isBundle(parsed)) {
        // Each section is independent an empty array is legitimate (nothing of that kind
        // yet), and a problem in one section must never prevent the others from parsing.
        if (
          parsed.tools !== undefined &&
          !(Array.isArray(parsed.tools) && parsed.tools.length === 0)
        ) {
          try {
            tools.push(...parseToolsValue(parsed.tools))
          } catch {
            failed++
          }
        }
        if (
          parsed.bookmarklets !== undefined &&
          !(Array.isArray(parsed.bookmarklets) && parsed.bookmarklets.length === 0)
        ) {
          try {
            bookmarkletCandidates.push(...parseBookmarkletsValue(parsed.bookmarklets))
          } catch {
            failed++
          }
        }
        if (Array.isArray(parsed.favicons)) {
          favicons.push(...parsed.favicons.filter(isStoredFavicon))
        }
        if (
          parsed.replacers !== undefined &&
          !(Array.isArray(parsed.replacers) && parsed.replacers.length === 0)
        ) {
          try {
            replacerCandidates.push(...parseReplacersValue(parsed.replacers))
          } catch {
            failed++
          }
        }
        if (isExportedLlmConfig(parsed.llmConfig)) llmConfig = parsed.llmConfig
        if (isNetworkConfig(parsed.networkConfig)) networkConfig = parsed.networkConfig
        if (isSmootterServicesConfig(parsed.smootterServices)) smootterServices = parsed.smootterServices
        continue
      }

      // Legacy shape: a bare tool or array of tools, from before bookmarklets existed.
      tools.push(...parseToolsValue(parsed))
    } catch {
      failed++
    }
  }

  return { tools, bookmarkletCandidates, favicons, replacerCandidates, llmConfig, networkConfig, smootterServices, failed }
}

/** A file that's just tools the common case skips the confirmation step entirely. */
export function needsImportConfirmation(parsed: ParsedImport): boolean {
  return (
    parsed.bookmarkletCandidates.length > 0 ||
    parsed.replacerCandidates.length > 0 ||
    parsed.llmConfig !== null ||
    parsed.networkConfig !== null ||
    parsed.smootterServices !== null
  )
}

export interface ImportSelection {
  tools: boolean
  bookmarklets: boolean
  replacers: boolean
  llmConfig: boolean
  networkConfig: boolean
  smootterServices: boolean
}

export interface ImportSummary {
  toolsImported: number
  bookmarkletsImported: number
  replacersImported: number
  llmConfigImported: boolean
  // True when the imported endpoint isn't a local runtime (Ollama, LM Studio, ...) those
  // need an API key, which imports never carry, so the caller should prompt for one.
  llmConfigNeedsApiKey: boolean
  networkConfigImported: boolean
  smootterServicesImported: boolean
}

/** Saves whichever sections `selection` keeps, from an already-parsed import. */
export async function applyParsedImport(
  parsed: ParsedImport,
  selection: ImportSelection,
): Promise<ImportSummary> {
  let toolsImported = 0
  let bookmarkletsImported = 0
  let replacersImported = 0
  let llmConfigImported = false
  let llmConfigNeedsApiKey = false
  let networkConfigImported = false
  let smootterServicesImported = false

  if (selection.tools && parsed.tools.length > 0) {
    for (const tool of parsed.tools) await saveTool(tool)
    toolsImported = parsed.tools.length
  }

  if (selection.bookmarklets && parsed.bookmarkletCandidates.length > 0) {
    const categoryCache = new Map(
      (await getAllCategories()).map((category) => [category.name, category]),
    )
    const bookmarkletsByUrl = new Map(
      (await getAllBookmarklets()).map((bookmarklet) => [bookmarklet.url, bookmarklet]),
    )
    bookmarkletsImported = await saveImportedBookmarklets(
      parsed.bookmarkletCandidates,
      categoryCache,
      bookmarkletsByUrl,
    )
    for (const favicon of parsed.favicons) await saveFavicon(favicon)
  }

  if (selection.replacers && parsed.replacerCandidates.length > 0) {
    const categoryCache = new Map(
      (await getAllReplacerCategories()).map((category) => [category.name, category]),
    )
    const replacersByPlaceholder = new Map(
      (await getAllReplacers()).map((replacer) => [replacer.placeholder, replacer]),
    )
    replacersImported = await saveImportedReplacers(
      parsed.replacerCandidates,
      categoryCache,
      replacersByPlaceholder,
    )
  }

  if (selection.llmConfig && parsed.llmConfig) {
    // New endpoint/model likely need a different key always cleared, the user re-enters it.
    await setPreference('llmConfig', { ...parsed.llmConfig, apiKey: '' })
    llmConfigImported = true
    if (!isLocalLlmEndpoint(parsed.llmConfig.endpoint)) llmConfigNeedsApiKey = true
  }

  if (selection.networkConfig && parsed.networkConfig) {
    await setPreference('networkConfig', parsed.networkConfig)
    networkConfigImported = true
  }

  if (selection.smootterServices && parsed.smootterServices) {
    await setPreference('smootterServices', parsed.smootterServices)
    smootterServicesImported = true
  }

  return {
    toolsImported,
    bookmarkletsImported,
    replacersImported,
    llmConfigImported,
    llmConfigNeedsApiKey,
    networkConfigImported,
    smootterServicesImported,
  }
}
