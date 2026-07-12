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

const logsByTab = new Map<number, NetworkEntry[]>()

function classify(contentType: string): NetworkEntryCategory {
  const type = contentType.toLowerCase()
  if (type.startsWith('image/') || type.startsWith('video/') || type.startsWith('audio/')) return 'media'
  if (/pdf|msword|officedocument|rtf|json|xml|text\/(plain|csv|html)/.test(type)) return 'document'
  return 'other'
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

      const { contentType, size } = readHeaders(details.responseHeaders)
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
}
