/**
 * contextMenu — right-click entries that jump straight to a specific Smootter view, instead of
 * always opening at Home. Registered once (chrome.contextMenus items persist across service
 * worker restarts — re-creating them outside onInstalled would throw on the duplicate id).
 */
import { openEnvironment } from './openEnvironment'

const ROOT_ID = 'smootter-root'

const ROUTE_BY_MENU_ID: Record<string, string> = {
  'smootter-open-tools': '/',
  'smootter-open-bookmarklets': '/bookmarklets',
  'smootter-open-network': '/network',
  'smootter-open-options': '/options',
}

export function registerContextMenu(): void {
  chrome.runtime.onInstalled.addListener(() => {
    const appName = chrome.runtime.getManifest().name
    chrome.contextMenus.create({ id: ROOT_ID, title: appName, contexts: ['page'] })
    chrome.contextMenus.create({
      id: 'smootter-open-tools',
      parentId: ROOT_ID,
      title: chrome.i18n.getMessage('home'),
      contexts: ['page'],
    })
    chrome.contextMenus.create({
      id: 'smootter-open-bookmarklets',
      parentId: ROOT_ID,
      title: chrome.i18n.getMessage('bookmarklets'),
      contexts: ['page'],
    })
    chrome.contextMenus.create({
      id: 'smootter-open-network',
      parentId: ROOT_ID,
      title: chrome.i18n.getMessage('network'),
      contexts: ['page'],
    })
    chrome.contextMenus.create({
      id: 'smootter-open-options',
      parentId: ROOT_ID,
      title: chrome.i18n.getMessage('options'),
      contexts: ['page'],
    })
  })

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    const route = ROUTE_BY_MENU_ID[String(info.menuItemId)]
    if (route === undefined || tab?.id === undefined) return
    void openEnvironment(tab.id, route)
  })
}
