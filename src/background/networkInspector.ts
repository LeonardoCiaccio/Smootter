/**
 * networkInspector — always-on, per-tab network request log.
 * Captures every response via chrome.webRequest.onResponseStarted (read-only,
 * headers only — never touches the body). Kept entirely in memory, never
 * persisted: the log for a tab is wiped on navigation (new page = fresh log)
 * and on tab close. This is what NetworkView reads from, not a store the
 * user edits — pure observation, matching the "replace devtools" use case.
 */
import { NETWORK_OTHER_CATEGORY, type NetworkEntry } from '@/shared/messages'
import { getPreference, preferenceStorageKey, DEFAULT_NETWORK_CONFIG, type NetworkConfig } from '@/shared/preferences'
import { NETWORK_MIME_CATEGORIES } from '@/shared/networkCategories'
import { fileExtensionOf } from '@/shared/url'

// Cache hits (and some opaque cross-origin responses) often arrive via webRequest with no
// content-type header at all, even though the resource is real — without this fallback those
// get dropped by the "no headers = junk" check below and silently vanish from the log.
const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  bmp: 'image/bmp',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
}

const MAX_ENTRIES_PER_TAB = 500

const logsByTab = new Map<number, NetworkEntry[]>()

// Cached in memory so the hot capture path (fires on every network response) never awaits
// chrome.storage. Kept in sync via chrome.storage.onChanged below, which fires regardless of
// which context wrote the preference (Options page, or a bundle import from anywhere else) —
// simpler and more reliable than threading an explicit update call through every writer.
let config: NetworkConfig = DEFAULT_NETWORK_CONFIG

// Guards against a malformed or older stored value (e.g. minSizeBytes saved as '' by a past UI
// bug) silently breaking capture — each field is defended independently rather than rejecting
// the whole config.
function normalizeConfig(value: NetworkConfig | undefined): NetworkConfig {
  if (!value || !Number.isFinite(value.minSizeBytes) || value.minSizeBytes < 0) return DEFAULT_NETWORK_CONFIG
  return value
}

// Fixed, system-defined rules — checked in order, first match wins. Nothing matching falls
// into the fixed "other" bucket. See shared/networkCategories.ts.
function classify(contentType: string): string {
  const type = contentType.toLowerCase()
  for (const rule of NETWORK_MIME_CATEGORIES) {
    if (rule.mimeTypes.some((mime) => type.includes(mime.toLowerCase()))) return rule.name
  }
  return NETWORK_OTHER_CATEGORY
}

// Textual data calls (API responses, config, auth) — not a "file" download, so the size floor
// below doesn't apply to them: a 40-byte JSON response can be exactly what an investigation needs.
function isDataCall(contentType: string): boolean {
  return /json|xml|text\/(plain|csv|html)/.test(contentType.toLowerCase())
}

function readHeaders(headers: chrome.webRequest.HttpHeader[] | undefined): { contentType: string; size: number } {
  let contentType = ''
  let size = 0
  for (const header of headers ?? []) {
    const name = header.name.toLowerCase()
    if (name === 'content-type') contentType = (header.value ?? '').split(';')[0].trim()
    else if (name === 'content-length') size = Number(header.value) || 0
  }
  return { contentType, size }
}

function appendEntry(tabId: number, entry: NetworkEntry): void {
  const log = logsByTab.get(tabId) ?? []
  log.push(entry)
  if (log.length > MAX_ENTRIES_PER_TAB) log.splice(0, log.length - MAX_ENTRIES_PER_TAB)
  logsByTab.set(tabId, log)
  // Best-effort live push to any open NetworkView. Unlike other broadcasts in this codebase
  // (e.g. broadcastPreference), this one fires on every single captured request — with no
  // NetworkView open, chrome.runtime.sendMessage rejects ("Receiving end does not exist") every
  // time, so the rejection must be swallowed here instead of left as an unhandled promise.
  chrome.runtime.sendMessage({ type: 'networkEntryCaptured', tabId, entry }).catch(() => {})
}

/** Returns the in-memory log for a tab, oldest first. Never mutated by the caller. */
export function getNetworkLog(tabId: number): NetworkEntry[] {
  return logsByTab.get(tabId) ?? []
}

function clearLog(tabId: number): void {
  logsByTab.delete(tabId)
}

/** Starts always-on capture. Independent of any NetworkView being open. */
export function registerNetworkInspector(): void {
  void getPreference('networkConfig').then((saved) => {
    config = normalizeConfig(saved)
  })

  const networkConfigKey = preferenceStorageKey('networkConfig')
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !(networkConfigKey in changes)) return
    config = normalizeConfig(changes[networkConfigKey].newValue as NetworkConfig | undefined)
  })

  chrome.webRequest.onResponseStarted.addListener(
    (details) => {
      if (details.tabId < 0) return
      if (details.url.startsWith('chrome-extension://')) return

      // Preflight/no-body responses never carry anything worth investigating.
      if (details.method === 'OPTIONS') return
      if (details.statusCode === 204 || details.statusCode === 304 || details.statusCode === 101) return

      const { contentType: headerContentType, size } = readHeaders(details.responseHeaders)
      const contentType = headerContentType || EXTENSION_CONTENT_TYPES[fileExtensionOf(details.url)] || ''
      // No content-length AND no content-type (even after the extension fallback above): not a
      // real payload either (redirects, sendBeacon pings, empty acks) — junk regardless of type.
      if (size === 0 && contentType === '') return
      // AJAX/fetch calls (details.type is 'xmlhttprequest' for both) are exempt from the size
      // floor outright, regardless of content-type — a tiny API response with no content-type
      // set is still exactly the kind of call an investigation cares about, not junk. Nested
      // iframes need no special handling: webRequest already reports every frame in the tab
      // (details.frameId identifies which), not just the top one.
      const isXhr = details.type === 'xmlhttprequest'
      // The size floor only applies to actual file downloads (media/binary "other") — small
      // data calls (json/xml/html/text, or any XHR/fetch response) are kept regardless of size.
      if (!isXhr && !isDataCall(contentType) && size > 0 && size < config.minSizeBytes) return

      const entry: NetworkEntry = {
        id: crypto.randomUUID(),
        url: details.url,
        method: details.method,
        status: details.statusCode,
        contentType: contentType || 'unknown',
        category: classify(contentType),
        size,
        timestamp: Date.now(),
      }
      appendEntry(details.tabId, entry)
    },
    { urls: ['<all_urls>'] },
    ['responseHeaders'],
  )

  // A new top-level navigation means a new page — start its log over.
  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId !== 0) return
    clearLog(details.tabId)
  })

  chrome.tabs.onRemoved.addListener((tabId) => {
    clearLog(tabId)
  })

  // Chrome sometimes swaps a tab's id in place (e.g. a prerendered tab taking over) — the old
  // id never gets an onRemoved event, so its log would otherwise leak in memory forever.
  chrome.tabs.onReplaced.addListener((_addedTabId, removedTabId) => {
    clearLog(removedTabId)
  })

  // A fresh browser launch means every previously-tracked tab is gone (tab ids aren't
  // preserved across restarts) — start with a clean slate rather than stale entries.
  chrome.runtime.onStartup.addListener(() => {
    logsByTab.clear()
  })
}
