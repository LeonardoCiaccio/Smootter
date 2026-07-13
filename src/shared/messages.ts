/**
 * Shared message contracts for the UI ⇄ background channel.
 * No logic here, only types. Messages travel over chrome.runtime.sendMessage
 * / onMessage stateless, no port names needed.
 */
import type { Preferences, LlmConfig } from './preferences'

/** Machine-readable outcome of an LLM call; the UI owns translating it. */
export type LlmErrorCode = 'network' | 'timeout' | 'http' | 'noToolSupport' | 'unknown'

/**
 * Sent when a channel function's validate() or business() throws the one reply every request
 * is guaranteed to get, even on an unexpected failure. Without this, a thrown error left the UI's
 * awaited channel.send() hanging forever with no response and no visible error (see channel.ts).
 */
export interface ChannelError {
  type: 'channelError'
  request: string
  detail: string
}

export interface PingRequest {
  type: 'ping'
}

export interface PongResponse {
  type: 'pong'
}

/** Distributes over each preference key so narrowing `key` also narrows `value`. */
export type SetPreferenceRequest = {
  [K in keyof Preferences]: { type: 'setPreference'; key: K; value: Preferences[K] }
}[keyof Preferences]

export type GetPreferenceRequest = {
  [K in keyof Preferences]: { type: 'getPreference'; key: K }
}[keyof Preferences]

/** Erases a stored preference (e.g. resetting the LLM config). Replies with preferenceValue (value: undefined). */
export type RemovePreferenceRequest = {
  [K in keyof Preferences]: { type: 'removePreference'; key: K }
}[keyof Preferences]

/**
 * Close signal. The iframe can't reach the host page's DOM to hide the
 * modal itself, so it sends this to the worker, which broadcasts it to
 * every connected port environment.ts is listening and hides on receipt.
 */
export interface CloseModalSignal {
  type: 'closeModal'
}

export interface GetUserScriptsStatusRequest {
  type: 'getUserScriptsStatus'
}

/** Reply to getUserScriptsStatus: whether "Allow User Scripts" is enabled. */
export interface UserScriptsStatusResponse {
  type: 'userScriptsStatus'
  enabled: boolean
}

export interface GetCurrentPageRequest {
  type: 'getCurrentPage'
}

/** Reply to getCurrentPage: the tab the iframe is embedded in, straight from chrome.tabs.Tab. */
export interface CurrentPageResponse {
  type: 'currentPage'
  url?: string
  title?: string
  favIconUrl?: string
}

/** Reply to getPreference: value is undefined when not stored. */
export type PreferenceValue = {
  [K in keyof Preferences]: { type: 'preferenceValue'; key: K; value?: Preferences[K] }
}[keyof Preferences]

/** Reply to setPreference: acknowledges the write. */
export type PreferenceSaved = {
  [K in keyof Preferences]: { type: 'preferenceSaved'; key: K; ok: boolean }
}[keyof Preferences]

/**
 * Sent by the wizard to test a tool's code for real. The worker runs it via
 * chrome.userScripts.execute() (never eval) a direct, one-shot, controlled
 * execution on the real webpage tab the wizard is already open on. Never
 * tied to a page-load trigger (document_start/idle): those only matter once
 * the tool actually runs for the end user, not during test.
 */
export interface TestCodeRequest {
  type: 'testCode'
  code: string
}

/**
 * Reply to testCode: whether the code ran without throwing, straight from
 * the chrome.userScripts.execute() call itself not a guess. Runs in a
 * disposable, invisible iframe the worker removes right after, so there's
 * nothing left to clean up on the wire.
 */
export interface TestCodeResult {
  type: 'testCodeResult'
  ok: boolean
  error?: string
}

/** Sent by the LLM config popup's Test button: verifies the endpoint, key and model actually work. */
export interface TestLlmConfigRequest {
  type: 'testLlmConfig'
  config: LlmConfig
}

/** Reply to testLlmConfig. */
export interface TestLlmConfigResult {
  type: 'testLlmConfigResult'
  ok: boolean
  errorCode?: LlmErrorCode
  detail?: string
}

/** One turn in the wizard's LLM chat the full conversation is sent as context on every request. */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Cap on stored/resent chat history: every turn resends the full
 * conversation as context, so letting it grow unbounded would keep
 * inflating both storage and every request's token cost.
 */
export const MAX_CHAT_MESSAGES = 40

/** Keeps only the most recent messages, per MAX_CHAT_MESSAGES. */
export function capChatMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.length > MAX_CHAT_MESSAGES
    ? messages.slice(messages.length - MAX_CHAT_MESSAGES)
    : messages
}

/**
 * Sent by the wizard's chat panel: asks the configured LLM to continue the
 * conversation. `messages` is the full chat so far (ending with the user's
 * latest turn) multi-turn context, not a single one-off prompt.
 * `existingCode` (the editor's current content, may be empty) is passed
 * separately the user may be improving working code, not starting fresh.
 */
export interface GenerateCodeRequest {
  type: 'generateCode'
  messages: ChatMessage[]
  existingCode: string
}

/**
 * Reply to generateCode. `reply` is the assistant's chat-facing message
 * (never code, never reasoning) shown in the transcript. `code` is applied
 * to the editor directly, never printed in the chat.
 */
export interface GenerateCodeResult {
  type: 'generateCodeResult'
  ok: boolean
  code?: string
  reply?: string
  errorCode?: LlmErrorCode
  detail?: string
}

/**
 * Sent by the Bookmarklets form's "Generate with AI" button: asks the model
 * to write a description, category, and tags for `url`. `existingTags`/
 * `existingCategories` are passed as context so the model prefers reusing
 * them over inventing near-duplicates.
 */
export interface GenerateBookmarkletRequest {
  type: 'generateBookmarklet'
  url: string
  currentTitle: string
  existingTags: string[]
  existingCategories: string[]
}

/** Reply to generateBookmarklet. */
export interface GenerateBookmarkletResult {
  type: 'generateBookmarkletResult'
  ok: boolean
  title?: string
  description?: string
  category?: string
  tags?: string[]
  errorCode?: LlmErrorCode
  detail?: string
}

/**
 * Sent by the Bookmarklets search panel's AI button: asks the model to find which saved
 * bookmarklets match a free-text `query`, understanding typos/wording the way a plain substring
 * filter can't. The model queries the DB itself (see queryBookmarklets) nothing is shipped
 * over this message besides the query text.
 */
export interface SearchBookmarkletsRequest {
  type: 'searchBookmarklets'
  query: string
}

/** Reply to searchBookmarklets: matching ids, most relevant first. */
export interface SearchBookmarkletsResult {
  type: 'searchBookmarkletsResult'
  ok: boolean
  ids?: string[]
  errorCode?: LlmErrorCode
  detail?: string
}

/**
 * The fixed fallback bucket for a response that matches none of the user's mime category
 * rules (see MimeCategoryRule in shared/preferences.ts) always present in the sidebar,
 * never one of the user-defined names.
 */
export const NETWORK_OTHER_CATEGORY = 'other'

/**
 * A single captured network response, read-only metadata from headers only (never the body).
 * `category` is the name of the mime category rule it matched at capture time (or
 * NETWORK_OTHER_CATEGORY) a plain string since categories are fully user-defined.
 */
export interface NetworkEntry {
  id: string
  url: string
  method: string
  status: number
  contentType: string
  category: string
  size: number
  timestamp: number
}

/** Sent by NetworkView on mount: asks for everything captured so far for the tab this iframe is embedded in. */
export interface GetNetworkLogRequest {
  type: 'getNetworkLog'
}

/** Reply to getNetworkLog. `tabId` lets the view recognize which live networkEntryCaptured broadcasts are its own. */
export interface NetworkLogResult {
  type: 'networkLogResult'
  tabId: number
  entries: NetworkEntry[]
}

/** Broadcast the moment a new response is captured for any tab NetworkView filters by tabId. */
export interface NetworkEntryCapturedBroadcast {
  type: 'networkEntryCaptured'
  tabId: number
  entry: NetworkEntry
}

/** Messages sent from the UI to the background. */
export type ChannelRequest =
  | PingRequest
  | SetPreferenceRequest
  | GetPreferenceRequest
  | RemovePreferenceRequest
  | CloseModalSignal
  | GetUserScriptsStatusRequest
  | GetCurrentPageRequest
  | TestCodeRequest
  | TestLlmConfigRequest
  | GenerateCodeRequest
  | GenerateBookmarkletRequest
  | SearchBookmarkletsRequest
  | GetNetworkLogRequest

/** Messages sent from the background to the UI. */
export type ChannelResponse =
  | PongResponse
  | PreferenceValue
  | PreferenceSaved
  | CloseModalSignal
  | UserScriptsStatusResponse
  | CurrentPageResponse
  | TestCodeResult
  | TestLlmConfigResult
  | GenerateBookmarkletResult
  | GenerateCodeResult
  | SearchBookmarkletsResult
  | NetworkLogResult
  | NetworkEntryCapturedBroadcast
  | ChannelError
