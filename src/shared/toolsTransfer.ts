/**
 * toolsTransfer export tools to JSON and import them back. The parsing/normalizing half
 * (parseToolsValue/parseToolsText) is also reused by the default-tools seed and by
 * exportImport.ts's combined tools+bookmarklets bundle saving to the DB is left to the
 * caller so those different entry points can each tally their own results.
 */
import type { StoredTool } from './toolsDb'

/** UTF-8-safe base64 encode btoa alone chokes on non-Latin1 characters. */
function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** Inverse of encodeBase64. Throws if the input isn't valid base64. */
function decodeBase64(text: string): string {
  const binary = atob(text)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

function slugify(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return slug === '' ? 'tool' : slug
}

/** Triggers a browser download of `data` as pretty-printed JSON shared by every exporter. */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Exported `code` is base64 keeps multi-line/quoted code safe to eyeball or paste around.
 * `enabled` is dropped entirely: imported tools always start disabled (see normalizeTool),
 * so carrying the exporter's own on/off state over would just be misleading.
 */
export function toolToExportable(tool: StoredTool): Omit<StoredTool, 'enabled'> {
  const { enabled: _enabled, ...rest } = tool
  return { ...rest, code: encodeBase64(tool.code) }
}

export function exportTool(tool: StoredTool): void {
  downloadJson(`${slugify(tool.name)}.json`, toolToExportable(tool))
}

type ImportCandidate = Partial<StoredTool> & { name: string; code: string }

function isImportCandidate(value: unknown): value is ImportCandidate {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.name === 'string' && typeof record.code === 'string'
}

// Real JS code almost always contains whitespace, parens, or other characters outside the
// base64 alphabet, so this rarely misfires but it isn't proof either way, hence the
// try/catch below still deciding the final answer.
const BASE64_SHAPE = /^[A-Za-z0-9+/]+={0,2}$/

/** Our own exports have base64 `code`; plain-text code (hand-written files) is accepted too. */
function decodeCode(raw: string): string {
  if (raw.length % 4 !== 0 || !BASE64_SHAPE.test(raw)) return raw
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
    // Imported tools always start disabled the user opts in after reviewing them.
    enabled: false,
    chatMessages: Array.isArray(raw.chatMessages) ? raw.chatMessages : [],
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : now,
    updatedAt: now,
  }
}

/** Normalizes an already-JSON.parsed value as either a single tool or a collection. */
export function parseToolsValue(parsed: unknown): StoredTool[] {
  const candidates = Array.isArray(parsed) ? parsed : [parsed]
  const valid = candidates.filter(isImportCandidate)
  if (valid.length === 0) throw new Error('invalidShape')
  return valid.map(normalizeTool)
}

/**
 * Parses raw JSON text as either a single tool or a collection of tools the core of
 * import, shared by the file-picker/drag-and-drop import path and the default-tools seed.
 */
export function parseToolsText(text: string): StoredTool[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('invalidJson')
  }
  return parseToolsValue(parsed)
}
