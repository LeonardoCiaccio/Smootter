/**
 * Shared message contracts for the UI ⇄ background channel.
 * No logic here, only types and the port name.
 */

// Persistent port names, derived from the manifest short_name
export const PORT_NAME = chrome.runtime.getManifest().short_name + '_channel' // UI (iframe)
export const RUNTIME_PORT_NAME = chrome.runtime.getManifest().short_name + '_runtime' // environment

import type { Preferences } from './preferences'

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

/** Messages sent from the UI to the background. */
export type ChannelRequest =
  | PingRequest
  | SetPreferenceRequest
  | GetPreferenceRequest
  | GetTopMessageRequest
  | CloseModalSignal
  | GetUserScriptsStatusRequest

/** Messages sent from the background to the UI. */
export type ChannelResponse =
  | PongResponse
  | PreferenceValue
  | PreferenceSaved
  | TopMessageResponse
  | CloseModalSignal
  | UserScriptsStatusResponse
