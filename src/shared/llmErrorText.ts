/** Translates an LLM call's machine-readable outcome into user-facing text. */
import type { LlmErrorCode } from './messages'

export function llmErrorText(errorCode: LlmErrorCode | undefined, detail: string | undefined): string {
  const key =
    errorCode === 'network'
      ? 'llmTestErrorNetwork'
      : errorCode === 'timeout'
        ? 'llmTestErrorTimeout'
        : errorCode === 'http'
          ? 'llmTestErrorHttp'
          : errorCode === 'noToolSupport'
            ? 'llmTestErrorNoTools'
            : 'llmTestErrorUnknown'
  const message = chrome.i18n.getMessage(key)
  return detail ? `${message} (${detail})` : message
}
