/**
 * router — Vue Router plugin for the SaaS iframe.
 * Hash mode: this page is served from chrome-extension://, no server to
 * resolve history-mode paths. environment.ts navigates by setting the
 * iframe's src with a `#/route` suffix.
 */
import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: () => import('../views/HomeView.vue') },
    { path: '/builder', component: () => import('../views/BuilderView.vue') },
    { path: '/options', component: () => import('../views/OptionsView.vue') },
    { path: '/bookmarklets', component: () => import('../views/BookmarkletsView.vue') },
    { path: '/network', component: () => import('../views/NetworkView.vue') },
  ],
})
