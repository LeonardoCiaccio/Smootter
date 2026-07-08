/**
 * Service worker (background) — event-driven.
 * Nessuno stato persistente in memoria: usare il DB del browser.
 */
chrome.runtime.onInstalled.addListener(() => {
  console.info('[Pippo] installato')
})
