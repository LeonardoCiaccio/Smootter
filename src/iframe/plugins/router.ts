/**
 * router — Vue Router plugin for the SaaS iframe.
 * Hash mode: this page is served from chrome-extension://, no server to
 * resolve history-mode paths. environment.ts navigates by setting the
 * iframe's src with a `#/route` suffix.
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import BuilderView from '../views/BuilderView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/builder', component: BuilderView },
    // Options still shares the generic placeholder until it gets real content.
    { path: '/options', component: PlaceholderView, props: { viewKey: 'options' } },
  ],
})
