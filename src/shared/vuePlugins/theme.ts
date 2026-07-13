/**
 * theme Vue plugin that owns the SaaS theme.
 * Applies it to <html>, keeps it synced with the background, and exposes a
 * toggle for any component. Single source of truth: no other context paints
 * a theme anymore, so nothing can drift out of sync.
 */
import { inject, ref, type App } from 'vue'
import { channelKey, type ChannelClient } from './messaging'

export type Theme = 'light' | 'dark'

const currentTheme = ref<Theme>('dark')
let channel: ChannelClient | undefined
// True once a value (stored or detected) has been applied, so a late initial
// reply can't stomp a theme the user already picked by hand.
let hasResolvedInitialTheme = false

function applyTheme(theme: Theme): void {
  currentTheme.value = theme
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function detectBrowserTheme(): Theme {
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Current theme (reactive) and a way to toggle it, for any component. */
export function useTheme() {
  return {
    theme: currentTheme,
    toggle(): void {
      hasResolvedInitialTheme = true
      const next: Theme = currentTheme.value === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      channel?.send({ type: 'setPreference', key: 'theme', value: next })
    },
  }
}

/** Fetch the stored theme once, falling back to the browser's if none is stored yet. */
async function loadInitialTheme(client: ChannelClient): Promise<void> {
  const response = await client.send({ type: 'getPreference', key: 'theme' })
  if (response.type !== 'preferenceValue' || response.key !== 'theme') return
  if (hasResolvedInitialTheme) return // the user already toggled while this was in flight

  if (response.value) {
    applyTheme(response.value)
    hasResolvedInitialTheme = true
    return
  }

  hasResolvedInitialTheme = true
  const detected = detectBrowserTheme()
  applyTheme(detected)
  client.send({ type: 'setPreference', key: 'theme', value: detected })
}

export const theme = {
  install(app: App): void {
    channel = app.runWithContext(() => inject(channelKey))
    if (!channel) return

    // Broadcasts only: reacts if the theme changes elsewhere (another tab).
    channel.subscribe((message) => {
      if (message.type !== 'preferenceValue' || message.key !== 'theme') return
      const value = message.value
      if (!hasResolvedInitialTheme || !value) return
      applyTheme(value)
    })

    void loadInitialTheme(channel)
  },
}
