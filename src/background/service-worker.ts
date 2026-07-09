/**
 * Service worker (background) — event-driven.
 * On toolbar click, injects environment on demand into the active tab.
 * Acts as the hub for the private UI ⇄ background channel.
 */
import { PORT_NAME, RUNTIME_PORT_NAME, type ChannelRequest } from '@/shared/messages'
import { getPreference, setPreference, type Preferences } from '@/shared/preferences'

// All connected channel ports (UI + environment)
const ports = new Set<chrome.runtime.Port>()

/** Inject environment into the given tab. */
function injectEnvironment(tabId: number): void {
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['environment.js'],
  })
}

/** Push a preference value to every connected port. */
function broadcastPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
  for (const port of ports) {
    port.postMessage({ type: 'preferenceValue', key, value })
  }
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

  if (message.type === 'getTopMessage') {
    port.postMessage({ type: 'topMessage', value: 'Hello World' })
    return
  }

  if (message.type === 'setPreference') {
    let ok = true
    try {
      await setPreference(message.key, message.value)
    } catch {
      ok = false
    }
    port.postMessage({ type: 'preferenceSaved', key: message.key, ok })
    if (ok) broadcastPreference(message.key, message.value)
    return
  }

  if (message.type === 'getPreference') {
    let value
    try {
      value = await getPreference(message.key)
    } catch {
      value = undefined
    }
    port.postMessage({ type: 'preferenceValue', key: message.key, value })
  }
}

/** Accept a known channel connection, track it, and wire its message handler. */
function handleConnection(port: chrome.runtime.Port): void {
  if (port.name !== PORT_NAME && port.name !== RUNTIME_PORT_NAME) return
  ports.add(port)
  port.onDisconnect.addListener(() => ports.delete(port))
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
