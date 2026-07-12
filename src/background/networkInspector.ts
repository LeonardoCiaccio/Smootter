/**
 * networkInspector — always-on, per-tab network request log.
 * Captures every response via chrome.webRequest.onResponseStarted (read-only,
 * headers only — never touches the body). Kept entirely in memory, never
 * persisted: the log for a tab is wiped on navigation (new page = fresh log)
 * and on tab close. This is what NetworkView reads from, not a store the
 * user edits — pure observation, matching the "replace devtools" use case.
 */
import type { NetworkEntry, NetworkEntryCategory } from '@/shared/messages'

const MAX_ENTRIES_PER_TAB = 500
// Below this, a response is noise for an investigation (tracking pixels, empty beacons) — not
// captured at all. Responses with no content-length header (size 0, e.g. chunked transfer) are
// kept regardless: their real size is unknown, not necessarily small.
const MIN_ENTRY_SIZE_BYTES = 1024

const logsByTab = new Map<number, NetworkEntry[]>()

function classify(contentType: string): NetworkEntryCategory {
  const type = contentType.toLowerCase()
  if (type.startsWith('image/') || type.startsWith('video/') || type.startsWith('audio/')) return 'media'
  if (/pdf|msword|officedocument|rtf|json|xml|text\/(plain|csv|html)/.test(type)) return 'document'
  return 'other'
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
  chrome.webRequest.onResponseStarted.addListener(
    (details) => {
      if (details.tabId < 0) return
      if (details.url.startsWith('chrome-extension://')) return

      // Preflight/no-body responses never carry anything worth investigating.
      if (details.method === 'OPTIONS') return
      if (details.statusCode === 204 || details.statusCode === 304 || details.statusCode === 101) return

      const { contentType, size } = readHeaders(details.responseHeaders)
      // No content-length AND no content-type: not a real payload either (redirects,
      // sendBeacon pings, empty acks) — junk regardless of type.
      if (size === 0 && contentType === '') return
      // The size floor only applies to actual file downloads (media/binary "other") — small
      // data calls (json/xml/html/text) are kept regardless of size, see isDataCall above.
      if (!isDataCall(contentType) && size > 0 && size < MIN_ENTRY_SIZE_BYTES) return

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
