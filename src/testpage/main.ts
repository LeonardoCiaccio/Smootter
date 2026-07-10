import { createApp } from 'vue'
import App from './App.vue'
import { TEST_PAGE_PORT_NAME } from '@/shared/messages'
import { createMessagingPlugin } from '@/shared/vuePlugins/messaging'
import { theme } from '@/shared/vuePlugins/theme'
import '@/styles/tailwind.css'

// The supervisor: registered as early as possible so it can catch errors
// thrown by the tool code chrome.userScripts injects into this page.
window.addEventListener('error', (event) => {
  window.__pippoTestError ??= event.message
})

createApp(App).use(createMessagingPlugin(TEST_PAGE_PORT_NAME)).use(theme).mount('#app')
