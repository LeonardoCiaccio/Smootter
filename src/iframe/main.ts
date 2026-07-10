import { createApp } from 'vue'
import App from './App.vue'
import { messaging } from './plugins/messaging'
import { theme } from './plugins/theme'
import { router } from './plugins/router'
import { toast } from './plugins/toast'
import '@/styles/tailwind.css'

createApp(App).use(messaging).use(theme).use(router).use(toast).mount('#app')
