/**
 * preferences — persistent user preferences via chrome.storage.local.
 * Extension-scoped storage: works in every context (service worker, iframe,
 * content script) and persists across sessions. Async API.
 */

const PREFIX = chrome.runtime.getManifest().short_name + '_pref_'

/**
 * Open provider: the user supplies their own OpenAI-compatible endpoint and
 * model. The key is optional — local runtimes (Ollama, LM Studio, ...)
 * don't require one.
 */
export interface LlmConfig {
  endpoint: string
  apiKey: string
  model: string
}

export interface Preferences {
  theme: 'light' | 'dark'
  llmConfig: LlmConfig
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
