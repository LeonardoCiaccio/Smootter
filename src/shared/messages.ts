/**
 * Shared message contracts for the UI ⇄ background channel.
 * No logic here, only types. Messages travel over chrome.runtime.sendMessage
 * / onMessage — stateless, no port names needed.
 */
import type { Preferences, LlmConfig } from './preferences'

/** Machine-readable outcome of an LLM call; the UI owns translating it. */
export type LlmErrorCode = 'network' | 'timeout' | 'http' | 'noToolSupport' | 'unknown'

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

export interface GetTopMessageRequest {
  type: 'getTopMessage'
}

/**
 * Close signal. The iframe can't reach the host page's DOM to hide the
 * modal itself, so it sends this to the worker, which broadcasts it to
 * every connected port — environment.ts is listening and hides on receipt.
 */
export interface CloseModalSignal {
  type: 'closeModal'
}

/** Reply to getTopMessage: the top message text. */
export interface TopMessageResponse {
  type: 'topMessage'
  value: string
}

export interface GetUserScriptsStatusRequest {
  type: 'getUserScriptsStatus'
}

/** Reply to getUserScriptsStatus: whether "Allow User Scripts" is enabled. */
export interface UserScriptsStatusResponse {
  type: 'userScriptsStatus'
  enabled: boolean
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
 * chrome.userScripts.execute() (never eval) — a direct, one-shot, controlled
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
 * the chrome.userScripts.execute() call itself — not a guess. `testId`
 * identifies whatever DOM the run left on the real page, so it can later be
 * cleaned up via cleanupTest.
 */
export interface TestCodeResult {
  type: 'testCodeResult'
  ok: boolean
  error?: string
  testId?: string
}

/**
 * Sent when leaving the tester step (back, or after a successful save):
 * removes any DOM a test run left on the real page (a popup, a banner, ...).
 * One-way, no reply expected.
 */
export interface CleanupTestRequest {
  type: 'cleanupTest'
  testId: string
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

/** Sent by the wizard's prompt box: asks the configured LLM to generate the tool's code. */
export interface GenerateCodeRequest {
  type: 'generateCode'
  prompt: string
}

/** Reply to generateCode. */
export interface GenerateCodeResult {
  type: 'generateCodeResult'
  ok: boolean
  code?: string
  errorCode?: LlmErrorCode
  detail?: string
}

/** Messages sent from the UI to the background. */
export type ChannelRequest =
  | PingRequest
  | SetPreferenceRequest
  | GetPreferenceRequest
  | GetTopMessageRequest
  | CloseModalSignal
  | GetUserScriptsStatusRequest
  | TestCodeRequest
  | CleanupTestRequest
  | TestLlmConfigRequest
  | GenerateCodeRequest

/** Messages sent from the background to the UI. */
export type ChannelResponse =
  | PongResponse
  | PreferenceValue
  | PreferenceSaved
  | TopMessageResponse
  | CloseModalSignal
  | UserScriptsStatusResponse
  | TestCodeResult
  | TestLlmConfigResult
  | GenerateCodeResult
