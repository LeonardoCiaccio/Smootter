/**
 * Service worker (background) — event-driven.
 * On toolbar click, injects environment on demand into the active tab.
 * The private UI ⇄ background channel lives in ./channel.
 * The generated-tool execution bridge (chrome.userScripts) lives in ./userScripts.
 */
import { registerChannel } from './channel'
import { registerUserScriptBridge } from './userScripts'

/** Inject environment into the given tab. */
function injectEnvironment(tabId: number): void {
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['environment.js'],
  })
}

registerChannel()
registerUserScriptBridge()

chrome.action.onClicked.addListener((tab) => {
  if (tab.id === undefined) return
  injectEnvironment(tab.id)
})

chrome.runtime.onInstalled.addListener(() => {
  // --> TODO: add a welcome page, or open the options page, or something
})
