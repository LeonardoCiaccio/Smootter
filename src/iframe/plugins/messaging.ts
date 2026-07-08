/**
 * messaging — Vue plugin exposing the private channel to the background.
 * Opens a persistent Port on install and provides an injectable client.
 */
import type { App, InjectionKey } from 'vue'
import { PORT_NAME, type ChannelRequest, type ChannelResponse } from '@/shared/messages'

export interface ChannelClient {
  send: (message: ChannelRequest) => void
  subscribe: (handler: (message: ChannelResponse) => void) => () => void
}

export const channelKey: InjectionKey<ChannelClient> = Symbol('pippo-channel')

/** Build the client over a persistent runtime Port. */
function createClient(): ChannelClient {
  const port = chrome.runtime.connect({ name: PORT_NAME })

  const send = (message: ChannelRequest): void => {
    port.postMessage(message)
  }

  const subscribe = (handler: (message: ChannelResponse) => void): (() => void) => {
    port.onMessage.addListener(handler)
    return () => port.onMessage.removeListener(handler)
  }

  return { send, subscribe }
}

export const messaging = {
  install(app: App): void {
    app.provide(channelKey, createClient())
  },
}
