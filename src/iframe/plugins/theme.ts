/**
 * theme — Vue plugin that syncs the iframe theme with the background.
 * On install: fetch the stored theme, apply it, and keep it in sync on changes.
 * Depends on the messaging plugin (must be installed first).
 */
import { inject, type App } from 'vue'
import { channelKey } from './messaging'

/** Toggle the `dark` class on the root element. */
function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const theme = {
  install(app: App): void {
    const channel = app.runWithContext(() => inject(channelKey))
    if (!channel) return

    channel.subscribe((message) => {
      if (message.type === 'preferenceValue' && message.key === 'theme' && message.value) {
        applyTheme(message.value)
      }
    })

    channel.send({ type: 'getPreference', key: 'theme' })
  },
}
