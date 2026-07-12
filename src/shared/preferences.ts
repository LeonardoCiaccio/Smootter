/**
 * preferences — persistent user preferences via chrome.storage.local.
 * Extension-scoped storage: works in every context (service worker, iframe,
 * content script) and persists across sessions. Async API.
 */

const PREFIX = chrome.runtime.getManifest().short_name + '_pref_'

/** The chrome.storage.local key a given preference is stored under — for reading raw chrome.storage.onChanged events. */
export function preferenceStorageKey<K extends keyof Preferences>(key: K): string {
  return PREFIX + key
}

/**
 * Open provider: the user supplies their own OpenAI-compatible endpoint and
 * model. The key is optional — local runtimes (Ollama, LM Studio, ...)
 * don't require one.
 */
export interface LlmConfig {
  endpoint: string
  apiKey: string
  model: string
  // Sent as max_tokens on every request — providers often default this low
  // enough to truncate a longer generated tool. Not auto-detectable in a
  // provider-agnostic way, so it's a plain user-set number.
  maxOutputTokens: number
}

/**
 * One sidebar bucket in NetworkView: `name` is shown as-is (fully user-editable, not
 * translated), `mimeTypes` are content-type substrings that route a response into it. Rules
 * are checked in order — the first match wins. Anything matching none of them falls into the
 * fixed "other" bucket (see NETWORK_OTHER_CATEGORY in shared/messages.ts).
 */
export interface MimeCategoryRule {
  name: string
  mimeTypes: string[]
}

export const DEFAULT_MIME_CATEGORIES: MimeCategoryRule[] = [
  { name: 'HTML', mimeTypes: ['text/html'] },
  { name: 'CSS', mimeTypes: ['text/css'] },
  { name: 'JavaScript', mimeTypes: ['javascript'] },
  { name: 'JSON', mimeTypes: ['json'] },
  { name: 'Images', mimeTypes: ['image/'] },
  // 'video/' catches the standard cases; the rest are streaming/legacy container types that
  // don't carry a video/ prefix (HLS playlists, old Flash-based video) — content, not
  // technique, aligned with GrabAnyMedia's own mimetype list.
  {
    name: 'Video',
    mimeTypes: [
      'video/',
      'vnd.apple.mpegurl',
      'x-mpegurl',
      'f4m+xml',
      'shockwave-flash',
      'futuresplash',
      'vnd.rn-realflash',
    ],
  },
  { name: 'Audio', mimeTypes: ['audio/'] },
  { name: 'PDF', mimeTypes: ['application/pdf'] },
  { name: 'Documents', mimeTypes: ['msword', 'officedocument', 'rtf', 'text/plain', 'text/csv'] },
]

/**
 * Network inspector capture filter, user-tunable from Options: `minSizeBytes` is the size
 * floor below which a file/media response isn't captured at all (data calls — json/xml/html/
 * text — are exempt, see networkInspector.ts); `blockedMimeTypes` are content-type substrings
 * the user never wants recorded, one per line in the UI; `mimeCategories` define the sidebar's
 * buckets, fully user-configurable, seeded with a sensible default set.
 */
export interface NetworkConfig {
  minSizeBytes: number
  blockedMimeTypes: string[]
  mimeCategories: MimeCategoryRule[]
}

export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  minSizeBytes: 100,
  blockedMimeTypes: [],
  mimeCategories: DEFAULT_MIME_CATEGORIES,
}

export interface Preferences {
  theme: 'light' | 'dark'
  llmConfig: LlmConfig
  networkConfig: NetworkConfig
}

/** Read a stored preference, or undefined if not set. */
export async function getPreference<K extends keyof Preferences>(
  key: K,
): Promise<Preferences[K] | undefined> {
  const storageKey = PREFIX + key
  const stored = await chrome.storage.local.get(storageKey)
  return stored[storageKey] as Preferences[K] | undefined
}

/** Persist a preference. */
export async function setPreference<K extends keyof Preferences>(
  key: K,
  value: Preferences[K],
): Promise<void> {
  await chrome.storage.local.set({ [PREFIX + key]: value })
}

/** Erase a stored preference (e.g. the user resetting the LLM config). */
export async function removePreference<K extends keyof Preferences>(key: K): Promise<void> {
  await chrome.storage.local.remove(PREFIX + key)
}
