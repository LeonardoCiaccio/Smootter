import { createApp } from 'vue'
import App from './App.vue'
import { messaging } from '@/shared/vuePlugins/messaging'
import { theme } from '@/shared/vuePlugins/theme'
import { router } from './plugins/router'
import { toast } from './plugins/toast'
import { escapeClose } from './plugins/escapeClose'
import '@/styles/tailwind.css'

createApp(App).use(messaging).use(theme).use(router).use(toast).use(escapeClose).mount('#app')
