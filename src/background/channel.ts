/**
 * channel owns the private UI ⇄ background channel.
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
  type GenerateBookmarkletRequest,
  type SearchBookmarkletsRequest,
} from '@/shared/messages'
import {
  getPreference,
  setPreference,
  removePreference,
  type Preferences,
} from '@/shared/preferences'
import { isLocalLlmEndpoint } from '@/shared/llmEndpoint'
import { isUserScriptsEnabled } from './userScripts'
import { runCodeTest } from './testRunner'
import {
  testLlmConfig,
  generateCode,
  generateBookmarkletMetadata,
  searchBookmarklets,
} from './llmClient'
import { getNetworkLog } from './networkInspector'

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
  name: 'getCurrentPage',
  validate() {},
  business(_args: unknown, context?: object) {
    const tab = (context as Context | undefined)?.sender.tab
    return { type: 'currentPage', url: tab?.url, title: tab?.title, favIconUrl: tab?.favIconUrl }
  },
})
grip.hook('getCurrentPage', {
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
    // apiKey is only required for non-local endpoints local runtimes (Ollama, LM Studio, ...) don't need one.
    const keyRequired = !isLocalLlmEndpoint(args.config?.endpoint ?? '')
    if (!args.config?.endpoint || !args.config?.model || (keyRequired && !args.config?.apiKey)) {
      throw new Error('endpoint, model and (unless the endpoint is local) an API key are required.')
    }
  },
  async business(args: TestLlmConfigRequest) {
    const result = await testLlmConfig(args.config)
    return {
      type: 'testLlmConfigResult',
      ok: result.ok,
      errorCode: result.errorCode,
      detail: result.detail,
    }
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
  async business(args: GenerateCodeRequest, context?: object) {
    const config = await getPreference('llmConfig')
    if (!config) {
      return {
        type: 'generateCodeResult',
        ok: false,
        errorCode: 'unknown',
        detail: 'No LLM configured.',
      }
    }
    const pageUrl = (context as Context | undefined)?.sender.tab?.url
    const result = await generateCode(config, args.messages, args.existingCode, pageUrl)
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
  name: 'generateBookmarklet',
  validate(args: GenerateBookmarkletRequest) {
    if (typeof args.url !== 'string' || args.url.trim() === '') throw new Error('url is required.')
  },
  async business(args: GenerateBookmarkletRequest) {
    const config = await getPreference('llmConfig')
    if (!config) {
      return {
        type: 'generateBookmarkletResult',
        ok: false,
        errorCode: 'unknown',
        detail: 'No LLM configured.',
      }
    }
    const result = await generateBookmarkletMetadata(
      config,
      args.url,
      args.currentTitle,
      args.existingTags,
      args.existingCategories,
    )
    return {
      type: 'generateBookmarkletResult',
      ok: result.ok,
      title: result.title,
      description: result.description,
      category: result.category,
      tags: result.tags,
      errorCode: result.errorCode,
      detail: result.detail,
    }
  },
})
grip.hook('generateBookmarklet', {
  after({ result }, context: Context) {
    if (result.isSuccess) context.sendResponse(result.result)
  },
})

grip.register({
  name: 'searchBookmarklets',
  validate(args: SearchBookmarkletsRequest) {
    if (typeof args.query !== 'string' || args.query.trim() === '')
      throw new Error('query is required.')
  },
  async business(args: SearchBookmarkletsRequest) {
    const config = await getPreference('llmConfig')
    if (!config) {
      return {
        type: 'searchBookmarkletsResult',
        ok: false,
        errorCode: 'unknown',
        detail: 'No LLM configured.',
      }
    }
    const result = await searchBookmarklets(config, args.query)
    return {
      type: 'searchBookmarkletsResult',
      ok: result.ok,
      ids: result.ids,
      errorCode: result.errorCode,
      detail: result.detail,
    }
  },
})
grip.hook('searchBookmarklets', {
  after({ result }, context: Context) {
    if (result.isSuccess) context.sendResponse(result.result)
  },
})

grip.register({
  name: 'getNetworkLog',
  validate() {},
  business(_args: unknown, context?: object) {
    const tabId = (context as Context | undefined)?.sender.tab?.id
    if (tabId === undefined) return { type: 'networkLogResult', tabId: -1, entries: [] }
    return { type: 'networkLogResult', tabId, entries: getNetworkLog(tabId) }
  },
})
grip.hook('getNetworkLog', {
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

// Every function above replies in its own `after` hook but only on success. If validate() or
// business() throws (a bad argument, a rejected chrome.* call, an unexpected error), that local
// hook never runs and sendResponse() is never called: the UI's awaited channel.send() hangs
// until the message port is garbage-collected, then rejects with an opaque "message port closed"
// error that nothing catches a stuck spinner with no error shown. This closes that hole once
// for every function, instead of duplicating an else-branch in each hook above.
// setPreference is excluded: its own hook already replies unconditionally (success or not), so
// adding this here too would call sendResponse a second time on failure.
const CHANNEL_FUNCTIONS_NEEDING_FAILURE_REPLY = [
  'ping',
  'getPreference',
  'removePreference',
  'closeModal',
  'getUserScriptsStatus',
  'getCurrentPage',
  'testCode',
  'testLlmConfig',
  'generateCode',
  'generateBookmarklet',
  'searchBookmarklets',
  'getNetworkLog',
] as const

for (const name of CHANNEL_FUNCTIONS_NEEDING_FAILURE_REPLY) {
  grip.hook(name, {
    after({ result }, context: Context) {
      if (result.isSuccess) return
      console.error(`[Smootter] channel "${name}" failed:`, result.message)
      context.sendResponse({ type: 'channelError', request: name, detail: result.message })
    },
  })
}

/** Start listening for one-off channel requests. */
export function registerChannel(): void {
  chrome.runtime.onMessage.addListener((message: ChannelRequest, sender, sendResponse) => {
    // Only our own contexts may drive this channel: it can write preferences (including the
    // LLM endpoint/key) and execute arbitrary code on a tab. There's no externally_connectable
    // today, so this is currently unreachable from a web page but it's a single check against
    // that ever changing (or a content script ever proxying messages) turning into a full
    // escalation. userScripts.ts's own channel is where tool-authored code talks to the worker.
    if (sender.id !== chrome.runtime.id) return false
    // Unregistered message.type: GRIP's fire() rejects for it. Any extension context could send
    // one (a future surface, a stale build after a rename) log it and reply instead of letting
    // it become an unhandled rejection in the worker console with the caller left hanging.
    grip.fire(message.type, message, { sender, sendResponse }).catch((error: unknown) => {
      console.error(`[Smootter] unknown channel message type "${message.type}":`, error)
      sendResponse({ type: 'channelError', request: message.type, detail: String(error) })
    })
    // Every handler above replies via sendResponse in its `after` hook, which
    // may run after this listener returns keep the channel open for it.
    return true
  })
}
