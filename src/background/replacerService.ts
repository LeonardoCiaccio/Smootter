/**
 * replacerService registers/unregisters replacer.js as a dynamic content script, in sync with
 * the "Smootters" → Replacer preference toggle. Off means truly nothing injected, on any page:
 * a static manifest content_scripts entry would still get injected (and would need its own
 * internal preference check to no-op), which isn't the same guarantee.
 *
 * Toggling off doesn't retroactively unload an already-injected replacer.js from open tabs
 * (chrome.scripting has no such mechanism) that's fine: replacer.js never trusts its own
 * injected-ness as "enabled", it asks the background on every single lookup (see channel.ts's
 * lookupReplacer handler), so a stale instance goes inert immediately regardless.
 *
 * Always unregisters before (re-)registering, even when already registered: a dynamic
 * registration persists across service worker restarts and extension reloads by id, but Chrome
 * does not re-read replacer.js's contents for an id that's already registered a rebuilt file on
 * disk keeps serving the stale previously-registered version until the id is dropped and
 * re-added. Skipping that step is what silently ran old code after every rebuild (see
 * resumerService.ts, where this was first discovered).
 */
import { getSmootterServices, preferenceStorageKey } from '@/shared/preferences'

const REPLACER_SCRIPT_ID = 'smootter-replacer'

async function unregisterReplacer(): Promise<void> {
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [REPLACER_SCRIPT_ID] })
  } catch {
    // Wasn't registered nothing to remove.
  }
}

async function registerReplacer(): Promise<void> {
  await unregisterReplacer()
  await chrome.scripting.registerContentScripts([
    { id: REPLACER_SCRIPT_ID, js: ['replacer.js'], matches: ['<all_urls>'], runAt: 'document_idle' },
  ])
}

async function syncReplacerRegistration(): Promise<void> {
  const config = await getSmootterServices()
  if (config.replacer) await registerReplacer()
  else await unregisterReplacer()
}

/** Syncs registration on startup, and again whenever the preference changes. */
export function registerReplacerService(): void {
  void syncReplacerRegistration()

  const smootterServicesKey = preferenceStorageKey('smootterServices')
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !(smootterServicesKey in changes)) return
    void syncReplacerRegistration()
  })
}
