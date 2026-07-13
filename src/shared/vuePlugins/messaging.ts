/**
 * messaging — Vue plugin exposing a stateless channel to the background.
 * Uses one-off chrome.runtime.sendMessage calls (each wakes the service
 * worker fresh) instead of a long-lived Port: MV3 kills idle service
 * workers, which silently drops persistent ports — "Attempting to use a
 * disconnected port object" — with no such failure mode for one-off calls.
 * Shared by every extension page.
 */
import type { App, InjectionKey } from 'vue'
import type { ChannelRequest, ChannelResponse } from '@/shared/messages'

export interface ChannelClient {
  /** One-off request; resolves with the background's direct reply. */
  send: (message: ChannelRequest) => Promise<ChannelResponse>
  /** Listens for messages the background broadcasts (not tied to a request). */
  subscribe: (handler: (message: ChannelResponse) => void) => () => void
}

export const channelKey: InjectionKey<ChannelClient> = Symbol('smootter-channel')

function createClient(): ChannelClient {
  const send = async (message: ChannelRequest): Promise<ChannelResponse> => {
    try {
      return await chrome.runtime.sendMessage(message)
    } catch (error) {
      // The worker is gone, the extension reloaded, or a handler failed to reply before the
      // port closed: never let this surface as an unhandled rejection that strands the
      // caller's loading state (see channel.ts's own failure-reply hook for the other half).
      return { type: 'channelError', request: message.type, detail: String(error) }
    }
  }

  const subscribe = (handler: (message: ChannelResponse) => void): (() => void) => {
    const listener = (message: ChannelResponse): void => handler(message)
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }

  return { send, subscribe }
}

export const messaging = {
  install(app: App): void {
    app.provide(channelKey, createClient())
  },
}
