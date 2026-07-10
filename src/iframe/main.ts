import { createApp } from 'vue'
import App from './App.vue'
import { PORT_NAME } from '@/shared/messages'
import { createMessagingPlugin } from '@/shared/vuePlugins/messaging'
import { theme } from '@/shared/vuePlugins/theme'
import { router } from './plugins/router'
import { toast } from './plugins/toast'
import '@/styles/tailwind.css'

createApp(App).use(createMessagingPlugin(PORT_NAME)).use(theme).use(router).use(toast).mount('#app')
