import { createApp } from 'vue'
import App from './App.vue'
import { messaging } from './plugins/messaging'
import '@/styles/tailwind.css'

createApp(App).use(messaging).mount('#app')
