/**
 * preferences — persistent user preferences via chrome.storage.local.
 * Extension-scoped storage: works in every context (service worker, iframe,
 * content script) and persists across sessions. Async API.
 */

const PREFIX = chrome.runtime.getManifest().short_name + '_pref_'

export interface Preferences {
  theme: 'light' | 'dark'
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
