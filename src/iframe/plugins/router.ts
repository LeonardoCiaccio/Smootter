/**
 * router — Vue Router plugin for the SaaS iframe.
 * Hash mode: this page is served from chrome-extension://, no server to
 * resolve history-mode paths. environment.ts navigates by setting the
 * iframe's src with a `#/route` suffix.
 *
 * Home/Options/Bookmarklets/Network are loaded eagerly (not code-split): they're the routes
 * the context menu jumps straight to, sometimes into an already-open modal — a lazy `import()`
 * there leaves the previous route visible on screen for a beat while the chunk loads, which
 * reads as a glitch. Builder stays lazy (it's huge — CodeMirror/Acorn — and only ever reached
 * by an explicit in-app click, never by a direct jump, so there's no stale view to flash).
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import OptionsView from '../views/OptionsView.vue'
import BookmarkletsView from '../views/BookmarkletsView.vue'
import NetworkView from '../views/NetworkView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/builder', component: () => import('../views/BuilderView.vue') },
    { path: '/options', component: OptionsView },
    { path: '/bookmarklets', component: BookmarkletsView },
    { path: '/network', component: NetworkView },
  ],
})
