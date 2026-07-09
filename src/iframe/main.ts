import { createApp } from 'vue'
import App from './App.vue'
import { messaging } from './plugins/messaging'
import { theme } from './plugins/theme'
import { router } from './plugins/router'
import '@/styles/tailwind.css'

createApp(App).use(messaging).use(theme).use(router).mount('#app')
