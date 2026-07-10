/**
 * channel — owns the private UI ⇄ background channel.
 * Stateless: every request arrives as a one-off chrome.runtime.sendMessage
 * (no persistent Port to go stale when the service worker idles out).
 * Routes incoming messages through a GRIP pipeline: business stays pure
 * domain logic; each function's `after` hook owns delivering the wire
 * response (sendResponse) and any side effect (e.g. broadcasting).
 */
import { Grip } from '@leonardo.ciaccio/grip'
import {
  type ChannelRequest,
  type SetPreferenceRequest,
  type GetPreferenceRequest,
  type RemovePreferenceRequest,
  type TestCodeRequest,
  type TestLlmConfigRequest,
  type GenerateCodeRequest,
} from '@/shared/messages'
import { getPreference, setPreference, removePreference, type Preferences } from '@/shared/preferences'
import { isLocalLlmEndpoint } from '@/shared/llmEndpoint'
import { isUserScriptsEnabled } from './userScripts'
import { runCodeTest } from './testRunner'
import { testLlmConfig, generateCode } from './llmClient'

interface Context {
  sender: chrome.runtime.MessageSender
  sendResponse: (response: unknown) => void
}

/** Push a preference value to every extension context currently listening. */
function broadcastPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
  void chrome.runtime.sendMessage({ type: 'preferenceValue', key, value })
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
    if (result.isSuccess) context.sendResponse(result.result)
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
    if (result.isSuccess) context.sendResponse(result.result)
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
    if (result.isSuccess) context.sendResponse(result.result)
  },
})

grip.register({
  name: 'removePreference',
  validate(args: RemovePreferenceRequest) {
    if (typeof args.key !== 'string') throw new Error('key is required.')
  },
  async business(args: RemovePreferenceRequest) {
    await removePreference(args.key)
    return { type: 'preferenceValue', key: args.key, value: undefined }
  },
})
grip.hook('removePreference', {
  after({ result }, context: Context) {
    if (!result.isSuccess) return
    context.sendResponse(result.result)
    void chrome.runtime.sendMessage(result.result)
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
  after({ result }, context: Context) {
    if (!result.isSuccess) return
    context.sendResponse(result.result)
    // environment.ts is a content script, not an extension page: it only
    // receives messages targeted at its tab via chrome.tabs.sendMessage,
    // never a plain chrome.runtime.sendMessage broadcast.
    const tabId = context.sender.tab?.id
    if (tabId !== undefined) void chrome.tabs.sendMessage(tabId, result.result)
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
    if (result.isSuccess) context.sendResponse(result.result)
  },
})

grip.register({
  name: 'testCode',
  validate(args: TestCodeRequest) {
    if (typeof args.code !== 'string' || args.code.trim() === '') {
      throw new Error('code is required.')
    }
  },
  async business(args: TestCodeRequest, context?: object) {
    const tabId = (context as Context | undefined)?.sender.tab?.id
    const result = await runCodeTest(args.code, tabId)
    return { type: 'testCodeResult', ok: result.ok, error: result.error }
  },
})
grip.hook('testCode', {
  after({ result }, context: Context) {
    if (result.isSuccess) context.sendResponse(result.result)
  },
})

grip.register({
  name: 'testLlmConfig',
  validate(args: TestLlmConfigRequest) {
    // apiKey is only required for non-local endpoints — local runtimes (Ollama, LM Studio, ...) don't need one.
    const keyRequired = !isLocalLlmEndpoint(args.config?.endpoint ?? '')
    if (!args.config?.endpoint || !args.config?.model || (keyRequired && !args.config?.apiKey)) {
      throw new Error('endpoint, model and (unless the endpoint is local) an API key are required.')
    }
  },
  async business(args: TestLlmConfigRequest) {
    const result = await testLlmConfig(args.config)
    return { type: 'testLlmConfigResult', ok: result.ok, errorCode: result.errorCode, detail: result.detail }
  },
})
grip.hook('testLlmConfig', {
  after({ result }, context: Context) {
    if (result.isSuccess) context.sendResponse(result.result)
  },
})

grip.register({
  name: 'generateCode',
  validate(args: GenerateCodeRequest) {
    if (!Array.isArray(args.messages) || args.messages.length === 0) {
      throw new Error('messages is required.')
    }
  },
  async business(args: GenerateCodeRequest) {
    const config = await getPreference('llmConfig')
    if (!config) {
      return { type: 'generateCodeResult', ok: false, errorCode: 'unknown', detail: 'No LLM configured.' }
    }
    const result = await generateCode(config, args.messages, args.existingCode)
    return {
      type: 'generateCodeResult',
      ok: result.ok,
      code: result.code,
      reply: result.reply,
      errorCode: result.errorCode,
      detail: result.detail,
    }
  },
})
grip.hook('generateCode', {
  after({ result }, context: Context) {
    if (result.isSuccess) context.sendResponse(result.result)
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
    context.sendResponse({ type: 'preferenceSaved', key: message.key, ok: result.isSuccess })
    if (result.isSuccess) broadcastPreference(message.key, message.value)
  },
})

/** Start listening for one-off channel requests. */
export function registerChannel(): void {
  chrome.runtime.onMessage.addListener((message: ChannelRequest, sender, sendResponse) => {
    // Unregistered message.type is a developer bug: GRIP throws intentionally,
    // surfacing as an unhandled rejection in the worker console. Do not catch it.
    void grip.fire(message.type, message, { sender, sendResponse })
    // Every handler above replies via sendResponse in its `after` hook, which
    // may run after this listener returns — keep the channel open for it.
    return true
  })
}
