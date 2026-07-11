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
  const send = (message: ChannelRequest): Promise<ChannelResponse> => {
    return chrome.runtime.sendMessage(message)
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
