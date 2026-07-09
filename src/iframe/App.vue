<script setup lang="ts">
import { ui } from '@/styles/ui'
</script>

<template>
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
</template>
