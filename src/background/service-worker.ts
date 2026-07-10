/**
 * Service worker (background) — event-driven.
 * On toolbar click, injects environment on demand into the active tab.
 * The private UI ⇄ background channel lives in ./channel.
 * The generated-tool execution bridge (chrome.userScripts) lives in ./userScripts.
 * Running saved tools for real, as the user browses, lives in ./toolsEngine.
 */
import { registerChannel } from './channel'
import { registerUserScriptBridge } from './userScripts'
import { registerToolsEngine } from './toolsEngine'

/** Inject environment into the given tab. */
function injectEnvironment(tabId: number): void {
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['environment.js'],
  })
}

registerChannel()
registerUserScriptBridge()
registerToolsEngine()

chrome.action.onClicked.addListener((tab) => {
  if (tab.id === undefined) return
  injectEnvironment(tab.id)
})

chrome.runtime.onInstalled.addListener(() => {
  // --> TODO: add a welcome page, or open the options page, or something
})
