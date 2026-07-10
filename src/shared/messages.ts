/**
 * Shared message contracts for the UI ⇄ background channel.
 * No logic here, only types and the port name.
 */

// Persistent port names, derived from the manifest short_name
export const PORT_NAME = chrome.runtime.getManifest().short_name + '_channel' // UI (iframe)
export const RUNTIME_PORT_NAME = chrome.runtime.getManifest().short_name + '_runtime' // environment
export const TEST_PAGE_PORT_NAME = chrome.runtime.getManifest().short_name + '_testpage' // code test page

import type { Preferences } from './preferences'
import type { ToolTrigger } from './toolsDb'

export interface PingRequest {
  type: 'ping'
}

export interface PongResponse {
  type: 'pong'
}

export interface SetPreferenceRequest {
  type: 'setPreference'
  key: keyof Preferences
  value: Preferences[keyof Preferences]
}

export interface GetPreferenceRequest {
  type: 'getPreference'
  key: keyof Preferences
}

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
export interface PreferenceValue {
  type: 'preferenceValue'
  key: keyof Preferences
  value?: Preferences[keyof Preferences]
}

/** Reply to setPreference: acknowledges the write. */
export interface PreferenceSaved {
  type: 'preferenceSaved'
  key: keyof Preferences
  ok: boolean
}

/**
 * Sent by the wizard to test a tool's code for real. The worker registers
 * it via chrome.userScripts (never eval) on a dedicated test page, timed by
 * `trigger`, and waits for that page's own supervisor to report back.
 */
export interface TestCodeRequest {
  type: 'testCode'
  code: string
  trigger: ToolTrigger
}

/** Reply to testCode: whether the code ran without throwing. */
export interface TestCodeResult {
  type: 'testCodeResult'
  ok: boolean
  error?: string
}

/**
 * Sent by the test page's own supervisor (window 'error' listener) once it
 * has a verdict for the given request. One-way: the worker resolves the
 * matching pending testCode call, no reply expected.
 */
export interface ReportTestResultRequest {
  type: 'reportTestResult'
  requestId: string
  ok: boolean
  error?: string
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
  | ReportTestResultRequest

/** Messages sent from the background to the UI. */
export type ChannelResponse =
  | PongResponse
  | PreferenceValue
  | PreferenceSaved
  | TopMessageResponse
  | CloseModalSignal
  | UserScriptsStatusResponse
  | TestCodeResult
