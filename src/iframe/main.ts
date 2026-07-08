import { createApp } from 'vue'
import App from './App.vue'
import { messaging } from './plugins/messaging'
import { theme } from './plugins/theme'
import '@/styles/tailwind.css'

createApp(App).use(messaging).use(theme).mount('#app')
