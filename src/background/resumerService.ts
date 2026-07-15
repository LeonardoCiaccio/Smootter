/**
 * resumerService registers/unregisters resumer.js as a dynamic content script, in sync with
 * the "Smootters" → Resumer preference toggle. Off means truly nothing injected, on any page:
 * a static manifest content_scripts entry would still get injected (and would need its own
 * internal preference check to no-op), which isn't the same guarantee.
 *
 * Always unregisters before (re-)registering, even when already registered: a dynamic
 * registration persists across service worker restarts and extension reloads by id, but Chrome
 * does not re-read resumer.js's contents for an id that's already registered a rebuilt file on
 * disk keeps serving the stale previously-registered version until the id is dropped and
 * re-added. Skipping that step is what silently ran old code after every rebuild.
 *
 * Caveat: chrome.scripting.registerContentScripts only affects future navigations already-open
 * tabs won't get resumer.js until they reload. Acceptable here: this is a convenience feature,
 * not a security boundary.
 */
import { getSmootterServices, preferenceStorageKey } from '@/shared/preferences'

const RESUMER_SCRIPT_ID = 'smootter-resumer'

async function unregisterResumer(): Promise<void> {
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [RESUMER_SCRIPT_ID] })
  } catch {
    // Wasn't registered nothing to remove.
  }
}

async function registerResumer(): Promise<void> {
  await unregisterResumer()
  await chrome.scripting.registerContentScripts([
    { id: RESUMER_SCRIPT_ID, js: ['resumer.js'], matches: ['<all_urls>'], runAt: 'document_idle' },
  ])
}

async function syncResumerRegistration(): Promise<void> {
  const config = await getSmootterServices()
  if (config.resumer) await registerResumer()
  else await unregisterResumer()
}

/** Syncs registration on startup, and again whenever the preference changes. */
export function registerResumerService(): void {
  void syncResumerRegistration()

  const smootterServicesKey = preferenceStorageKey('smootterServices')
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !(smootterServicesKey in changes)) return
    void syncResumerRegistration()
  })
}
