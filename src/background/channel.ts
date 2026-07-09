/**
 * channel — owns the private UI ⇄ background channel.
 * Tracks connected ports, routes incoming messages to small per-type handlers,
 * and broadcasts preference changes. Keeps the service worker readable.
 */
import {
  PORT_NAME,
  RUNTIME_PORT_NAME,
  type ChannelRequest,
  type SetPreferenceRequest,
  type GetPreferenceRequest,
} from '@/shared/messages'
import { getPreference, setPreference, type Preferences } from '@/shared/preferences'

// All connected channel ports (UI + environment)
const ports = new Set<chrome.runtime.Port>()

/** Push a preference value to every connected port. */
function broadcastPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
  for (const port of ports) {
    port.postMessage({ type: 'preferenceValue', key, value })
  }
}

// ---- Per-type handlers ----

function handlePing(port: chrome.runtime.Port): void {
  port.postMessage({ type: 'pong' })
}

function handleGetTopMessage(port: chrome.runtime.Port): void {
  port.postMessage({ type: 'topMessage', value: chrome.i18n.getMessage('topMessage') })
}

async function handleSetPreference(
  port: chrome.runtime.Port,
  message: SetPreferenceRequest,
): Promise<void> {
  let ok = true
  try {
    await setPreference(message.key, message.value)
  } catch {
    ok = false
  }
  port.postMessage({ type: 'preferenceSaved', key: message.key, ok })
  if (ok) broadcastPreference(message.key, message.value)
}

async function handleGetPreference(
  port: chrome.runtime.Port,
  message: GetPreferenceRequest,
): Promise<void> {
  let value
  try {
    value = await getPreference(message.key)
  } catch {
    value = undefined
  }
  port.postMessage({ type: 'preferenceValue', key: message.key, value })
}

/** Route one message to its handler. */
function routeMessage(port: chrome.runtime.Port, message: ChannelRequest): void {
  switch (message.type) {
    case 'ping':
      return handlePing(port)
    case 'getTopMessage':
      return handleGetTopMessage(port)
    case 'setPreference':
      void handleSetPreference(port, message)
      return
    case 'getPreference':
      void handleGetPreference(port, message)
      return
  }
}

/** Accept a known channel connection, track it, and wire its message handler. */
function handleConnection(port: chrome.runtime.Port): void {
  if (port.name !== PORT_NAME && port.name !== RUNTIME_PORT_NAME) return
  ports.add(port)
  port.onDisconnect.addListener(() => ports.delete(port))
  port.onMessage.addListener((message: ChannelRequest) => routeMessage(port, message))
}

/** Start listening for channel connections. */
export function registerChannel(): void {
  chrome.runtime.onConnect.addListener(handleConnection)
}
