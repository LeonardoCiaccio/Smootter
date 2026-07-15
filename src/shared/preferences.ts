/**
 * preferences persistent user preferences via chrome.storage.local.
 * Extension-scoped storage: works in every context (service worker, iframe,
 * content script) and persists across sessions. Async API.
 */

const PREFIX = chrome.runtime.getManifest().short_name + '_pref_'

/** The chrome.storage.local key a given preference is stored under for reading raw chrome.storage.onChanged events. */
export function preferenceStorageKey<K extends keyof Preferences>(key: K): string {
  return PREFIX + key
}

/**
 * Open provider: the user supplies their own OpenAI-compatible endpoint and
 * model. The key is optional local runtimes (Ollama, LM Studio, ...)
 * don't require one.
 */
export interface LlmConfig {
  endpoint: string
  apiKey: string
  model: string
  // Sent as max_tokens on every request providers often default this low
  // enough to truncate a longer generated tool. Not auto-detectable in a
  // provider-agnostic way, so it's a plain user-set number.
  maxOutputTokens: number
}

/**
 * Network inspector capture filter, user-tunable from Options: `minSizeBytes` is the size
 * floor below which a file/media response isn't captured at all (data calls json/xml/html/
 * text are exempt, see networkInspector.ts). Sidebar categories are a fixed, system-defined
 * set (see shared/networkCategories.ts) not part of this config.
 */
export interface NetworkConfig {
  minSizeBytes: number
}

export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  minSizeBytes: 100,
}

/**
 * "Smootters": optional always-on page services, each independently toggleable from Options.
 * Off by default every one of these injects a content script into every page the user
 * visits, so none should run without explicit opt-in.
 */
export interface SmootterServicesConfig {
  // Hover an article to summarize it in Chat see resumer.ts.
  resumer: boolean
  replacer: boolean
}

export const DEFAULT_SMOOTTER_SERVICES: SmootterServicesConfig = {
  resumer: false,
  replacer: false,
}

export interface Preferences {
  theme: 'light' | 'dark'
  llmConfig: LlmConfig
  networkConfig: NetworkConfig
  smootterServices: SmootterServicesConfig
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

/**
 * smootterServices, always fully populated. This set of toggles grows over time (a new one
 * was added after some users already had an old, narrower object in storage), and a plain
 * getPreference() would leave a newly added key simply absent (not even `false`) on any
 * install whose stored value predates it. Every reader merges with the defaults here instead
 * of repeating that merge (or forgetting to).
 */
export async function getSmootterServices(): Promise<SmootterServicesConfig> {
  const stored = await getPreference('smootterServices')
  return { ...DEFAULT_SMOOTTER_SERVICES, ...stored }
}
