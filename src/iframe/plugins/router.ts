/**
 * router — Vue Router plugin for the SaaS iframe.
 * Hash mode: this page is served from chrome-extension://, no server to
 * resolve history-mode paths. environment.ts navigates by setting the
 * iframe's src with a `#/route` suffix.
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import BuilderView from '../views/BuilderView.vue'
import OptionsView from '../views/OptionsView.vue'
import BookmarkletsView from '../views/BookmarkletsView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/builder', component: BuilderView },
    { path: '/options', component: OptionsView },
    { path: '/bookmarklets', component: BookmarkletsView },
  ],
})
