/**
 * Service worker (background) — event-driven.
 * On toolbar click, injects environment on demand into the active tab.
 * Acts as the hub for the private UI ⇄ background channel.
 */
import { PORT_NAME, RUNTIME_PORT_NAME, type ChannelRequest } from '@/shared/messages'
import { getPreference, setPreference } from '@/shared/preferences'

/** Inject environment into the given tab. */
function injectEnvironment(tabId: number): void {
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['environment.js'],
  })
}

/** Handle a single channel message and reply on the same port. */
async function handleChannelMessage(
  port: chrome.runtime.Port,
  message: ChannelRequest,
): Promise<void> {
  if (message.type === 'ping') {
    port.postMessage({ type: 'pong' })
    return
  }

  if (message.type === 'setPreference') {
    let ok = true
    try {
      await setPreference(message.key, message.value)
    } catch {
      ok = false
    }
    port.postMessage({ type: 'preferenceResult', ok })
    return
  }

  if (message.type === 'getPreference') {
    try {
      const value = await getPreference(message.key)
      port.postMessage({ type: 'preferenceResult', ok: true, value })
    } catch {
      port.postMessage({ type: 'preferenceResult', ok: false })
    }
  }
}

/** Accept a known channel connection and wire its message handler. */
function handleConnection(port: chrome.runtime.Port): void {
  if (port.name !== PORT_NAME && port.name !== RUNTIME_PORT_NAME) return
  port.onMessage.addListener((message: ChannelRequest) => handleChannelMessage(port, message))
}

chrome.runtime.onConnect.addListener(handleConnection)

chrome.action.onClicked.addListener((tab) => {
  if (tab.id === undefined) return
  injectEnvironment(tab.id)
})

chrome.runtime.onInstalled.addListener(() => {
  // --> TODO: add a welcome page, or open the options page, or something
})
