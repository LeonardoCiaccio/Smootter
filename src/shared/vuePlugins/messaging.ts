/**
 * messaging — Vue plugin exposing a private channel to the background.
 * Opens a persistent Port on install and provides an injectable client.
 * Shared by every extension page (SaaS iframe, test page, ...) — each
 * connects under its own port name so the worker can tell them apart.
 */
import type { App, InjectionKey } from 'vue'
import type { ChannelRequest, ChannelResponse } from '@/shared/messages'

export interface ChannelClient {
  send: (message: ChannelRequest) => void
  subscribe: (handler: (message: ChannelResponse) => void) => () => void
}

export const channelKey: InjectionKey<ChannelClient> = Symbol('pippo-channel')

/** Build the client over a persistent runtime Port. */
function createClient(portName: string): ChannelClient {
  const port = chrome.runtime.connect({ name: portName })

  const send = (message: ChannelRequest): void => {
    port.postMessage(message)
  }

  const subscribe = (handler: (message: ChannelResponse) => void): (() => void) => {
    port.onMessage.addListener(handler)
    return () => port.onMessage.removeListener(handler)
  }

  return { send, subscribe }
}

/** Build the plugin for a given port name. */
export function createMessagingPlugin(portName: string) {
  return {
    install(app: App): void {
      app.provide(channelKey, createClient(portName))
    },
  }
}
