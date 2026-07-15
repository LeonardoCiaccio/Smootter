/**
 * Service worker (background) event-driven.
 * On toolbar click, injects environment on demand into the active tab.
 * The private UI ⇄ background channel lives in ./channel.
 * The "Allow User Scripts" status check lives in ./userScripts.
 * Running saved tools for real, as the user browses, lives in ./toolsEngine.
 * The right-click "jump to a specific view" entries live in ./contextMenu.
 * The optional "Smootters" always-on page services (Resumer, Replacer) live in
 * ./resumerService and ./replacerService.
 */
import { registerChannel } from './channel'
import { registerToolsEngine } from './toolsEngine'
import { registerNetworkInspector } from './networkInspector'
import { registerContextMenu } from './contextMenu'
import { registerResumerService } from './resumerService'
import { registerReplacerService } from './replacerService'
import { openEnvironment } from './openEnvironment'
import { seedDefaultTools } from './defaultTools'
import { seedDefaultReplacers } from './defaultReplacers'

registerChannel()
registerToolsEngine()
registerNetworkInspector()
registerContextMenu()
registerResumerService()
registerReplacerService()

chrome.action.onClicked.addListener((tab) => {
  if (tab.id === undefined) return
  void openEnvironment(tab.id)
})

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    void seedDefaultTools()
    void seedDefaultReplacers()
  }
})
