/**
 * toolsTransfer — export tools to JSON files and import them back.
 * Import auto-detects a single tool object vs. a collection (array) in the
 * same file, and fills in anything missing so older/partial exports still load.
 */
import { saveTool, type StoredTool } from './toolsDb'

/** UTF-8-safe base64 encode — btoa alone chokes on non-Latin1 characters. */
function encodeBase64(text: string): string {
  return btoa(unescape(encodeURIComponent(text)))
}

/** Inverse of encodeBase64. Throws if the input isn't valid base64. */
function decodeBase64(text: string): string {
  return decodeURIComponent(escape(atob(text)))
}

function slugify(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return slug === '' ? 'tool' : slug
}

function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Exported `code` is base64 — keeps multi-line/quoted code safe to eyeball or paste around.
 * `enabled` is dropped entirely: imported tools always start disabled (see normalizeTool),
 * so carrying the exporter's own on/off state over would just be misleading.
 */
function toExportable(tool: StoredTool): Omit<StoredTool, 'enabled'> {
  const { enabled: _enabled, ...rest } = tool
  return { ...rest, code: encodeBase64(tool.code) }
}

export function exportTool(tool: StoredTool): void {
  downloadJson(`${slugify(tool.name)}.json`, toExportable(tool))
}

export function exportAllTools(tools: StoredTool[]): void {
  downloadJson(`pippo-tools-${new Date().toISOString().slice(0, 10)}.json`, tools.map(toExportable))
}

type ImportCandidate = Partial<StoredTool> & { name: string; code: string }

function isImportCandidate(value: unknown): value is ImportCandidate {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.name === 'string' && typeof record.code === 'string'
}

/** Our own exports have base64 `code`; plain-text code (hand-written files) is accepted too. */
function decodeCode(raw: string): string {
  try {
    return decodeBase64(raw)
  } catch {
    return raw
  }
}

/** Fills in anything missing/legacy so older or hand-written exports still import cleanly. */
function normalizeTool(raw: ImportCandidate): StoredTool {
  const now = Date.now()
  return {
    id: typeof raw.id === 'string' && raw.id !== '' ? raw.id : crypto.randomUUID(),
    name: raw.name,
    description: raw.description ?? '',
    trigger: raw.trigger === 'pageStart' ? 'pageStart' : 'pageIdle',
    scope: raw.scope === 'domain' ? 'domain' : 'everywhere',
    scopeTargets: raw.scopeTargets ?? '',
    code: decodeCode(raw.code),
    // Imported tools always start disabled — the user opts in after reviewing them.
    enabled: false,
    chatMessages: Array.isArray(raw.chatMessages) ? raw.chatMessages : [],
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : now,
    updatedAt: now,
  }
}

/**
 * Parses raw JSON text as either a single tool or a collection of tools — the core of
 * import, shared by the file-picker/drag-and-drop import path and the default-tools seed.
 */
export function parseToolsText(text: string): StoredTool[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('invalidJson')
  }

  const candidates = Array.isArray(parsed) ? parsed : [parsed]
  const valid = candidates.filter(isImportCandidate)
  if (valid.length === 0) throw new Error('invalidShape')

  return valid.map(normalizeTool)
}

/** Parses a file's content as either a single tool or a collection of tools. */
export async function parseToolsFile(file: File): Promise<StoredTool[]> {
  return parseToolsText(await file.text())
}

export interface ImportSummary {
  imported: number
  failed: number
}

/** Parses and saves every file (toolbar file picker or a drag-and-drop drop), tallying failures. */
export async function importToolsFromFiles(files: File[]): Promise<ImportSummary> {
  let imported = 0
  let failed = 0

  for (const file of files) {
    try {
      const tools = await parseToolsFile(file)
      for (const tool of tools) await saveTool(tool)
      imported += tools.length
    } catch {
      failed++
    }
  }

  return { imported, failed }
}
