<script setup lang="ts">
import { ui } from '@/styles/ui'
import AppToolbar from './components/AppToolbar.vue'
import AppFooter from './components/AppFooter.vue'
import ToastContainer from './components/ToastContainer.vue'
</script>

<template>
  <div :class="ui.appShell">
    <div :class="ui.heroGlow">
      <div :class="ui.heroGlowBlobA" />
      <div :class="ui.heroGlowBlobB" />
      <div :class="ui.heroGlowBlobC" />
    </div>
    <ToastContainer />
    <AppToolbar />
    <div :class="ui.layoutRoot">
      <div :class="ui.layoutSide" />
      <div :class="ui.layoutCenter">
        <router-view v-slot="{ Component, route }">
          <Transition name="view">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </router-view>
      </div>
      <div :class="ui.layoutSide" />
    </div>
    <AppFooter />
  </div>
</template>
