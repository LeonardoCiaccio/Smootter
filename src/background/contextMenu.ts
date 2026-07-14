/**
 * contextMenu right-click entries that jump straight to a specific Smootter view, instead of
 * always opening at Home.
 */
import { openEnvironment } from './openEnvironment'

const ROOT_ID = 'smootter-root'

const MENU_ENTRIES: ReadonlyArray<{ id: string; messageKey: string; route: string }> = [
  { id: 'smootter-open-home', messageKey: 'home', route: '/' },
  { id: 'smootter-open-tools', messageKey: 'tools', route: '/tools' },
  { id: 'smootter-open-bookmarklets', messageKey: 'bookmarklets', route: '/bookmarklets' },
  { id: 'smootter-open-network', messageKey: 'network', route: '/network' },
  { id: 'smootter-open-chat', messageKey: 'chat', route: '/chat' },
  { id: 'smootter-open-options', messageKey: 'options', route: '/options' },
]

const ROUTE_BY_MENU_ID: Record<string, string> = Object.fromEntries(
  MENU_ENTRIES.map((entry) => [entry.id, entry.route]),
)

function createMenu(): void {
  const appName = chrome.runtime.getManifest().name
  chrome.contextMenus.create({ id: ROOT_ID, title: appName, contexts: ['page'] })
  for (const entry of MENU_ENTRIES) {
    chrome.contextMenus.create({
      id: entry.id,
      parentId: ROOT_ID,
      title: chrome.i18n.getMessage(entry.messageKey),
      contexts: ['page'],
    })
  }
}

export function registerContextMenu(): void {
  // onInstalled fires on 'install', but also on 'update' and 'chrome_update' and menu items
  // persist across service worker restarts, so on an update these ids already exist and
  // creating them again throws "duplicate id". Wiping first makes this idempotent regardless
  // of which onInstalled reason triggered it.
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(createMenu)
  })

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    const route = ROUTE_BY_MENU_ID[String(info.menuItemId)]
    if (route === undefined || tab?.id === undefined) return
    void openEnvironment(tab.id, route)
  })
}
