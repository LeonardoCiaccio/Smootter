/**
 * channel — owns the private UI ⇄ background channel.
 * Tracks connected ports and routes incoming messages through a GRIP pipeline:
 * business stays pure domain logic; each function's `after` hook owns
 * delivering the wire response (and any side effect, e.g. broadcasting).
 */
import { Grip } from '@leonardo.ciaccio/grip'
import {
  PORT_NAME,
  RUNTIME_PORT_NAME,
  TEST_PAGE_PORT_NAME,
  type ChannelRequest,
  type SetPreferenceRequest,
  type GetPreferenceRequest,
  type TestCodeRequest,
  type ReportTestResultRequest,
} from '@/shared/messages'
import { getPreference, setPreference, type Preferences } from '@/shared/preferences'
import { isUserScriptsEnabled } from './userScripts'
import { runCodeTest, resolveTestResult } from './testRunner'

// All connected channel ports (UI + environment)
const ports = new Set<chrome.runtime.Port>()

interface Context {
  port: chrome.runtime.Port
}

/** Push a preference value to every connected port. */
function broadcastPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
  for (const port of ports) {
    port.postMessage({ type: 'preferenceValue', key, value })
  }
}

// ---- GRIP pipeline: one registered function per message type ----
const grip = new Grip()

grip.register({
  name: 'ping',
  validate() {},
  business() {
    return { type: 'pong' }
  },
})
grip.hook('ping', {
  after({ result }, context: Context) {
    if (result.isSuccess) context.port.postMessage(result.result)
  },
})

grip.register({
  name: 'getTopMessage',
  validate() {},
  business() {
    return { type: 'topMessage', value: chrome.i18n.getMessage('topMessage') }
  },
})
grip.hook('getTopMessage', {
  after({ result }, context: Context) {
    if (result.isSuccess) context.port.postMessage(result.result)
  },
})

grip.register({
  name: 'getPreference',
  validate(args: GetPreferenceRequest) {
    if (typeof args.key !== 'string') throw new Error('key is required.')
  },
  async business(args: GetPreferenceRequest) {
    const value = await getPreference(args.key)
    return { type: 'preferenceValue', key: args.key, value }
  },
})
grip.hook('getPreference', {
  after({ result }, context: Context) {
    if (result.isSuccess) context.port.postMessage(result.result)
  },
})

grip.register({
  name: 'closeModal',
  validate() {},
  business() {
    return { type: 'closeModal' }
  },
})
grip.hook('closeModal', {
  after({ result }) {
    if (!result.isSuccess) return
    for (const port of ports) port.postMessage(result.result)
  },
})

grip.register({
  name: 'getUserScriptsStatus',
  validate() {},
  async business() {
    const enabled = await isUserScriptsEnabled()
    return { type: 'userScriptsStatus', enabled }
  },
})
grip.hook('getUserScriptsStatus', {
  after({ result }, context: Context) {
    if (result.isSuccess) context.port.postMessage(result.result)
  },
})

grip.register({
  name: 'testCode',
  validate(args: TestCodeRequest) {
    if (typeof args.code !== 'string' || args.code.trim() === '') {
      throw new Error('code is required.')
    }
  },
  async business(args: TestCodeRequest) {
    const result = await runCodeTest(args.code, args.trigger)
    return { type: 'testCodeResult', ok: result.ok, error: result.error }
  },
})
grip.hook('testCode', {
  after({ result }, context: Context) {
    if (result.isSuccess) context.port.postMessage(result.result)
  },
})

grip.register({
  name: 'reportTestResult',
  validate(args: ReportTestResultRequest) {
    if (typeof args.requestId !== 'string') throw new Error('requestId is required.')
  },
  business(args: ReportTestResultRequest) {
    resolveTestResult(args.requestId, { ok: args.ok, error: args.error })
  },
})

grip.register({
  name: 'setPreference',
  validate(args: SetPreferenceRequest) {
    if (typeof args.key !== 'string') throw new Error('key is required.')
  },
  async business(args: SetPreferenceRequest) {
    await setPreference(args.key, args.value)
  },
})
grip.hook('setPreference', {
  after({ args, result }, context: Context) {
    const message = args as SetPreferenceRequest
    context.port.postMessage({ type: 'preferenceSaved', key: message.key, ok: result.isSuccess })
    if (result.isSuccess) broadcastPreference(message.key, message.value)
  },
})

/** Accept a known channel connection, track it, and wire its message handler. */
function handleConnection(port: chrome.runtime.Port): void {
  const knownPorts: string[] = [PORT_NAME, RUNTIME_PORT_NAME, TEST_PAGE_PORT_NAME]
  if (!knownPorts.includes(port.name)) return
  ports.add(port)
  port.onDisconnect.addListener(() => ports.delete(port))
  port.onMessage.addListener((message: ChannelRequest) => {
    // Unregistered message.type is a developer bug: GRIP throws intentionally,
    // surfacing as an unhandled rejection in the worker console. Do not catch it.
    void grip.fire(message.type, message, { port })
  })
}

/** Start listening for channel connections. */
export function registerChannel(): void {
  chrome.runtime.onConnect.addListener(handleConnection)
}
