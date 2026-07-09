<script setup lang="ts">
import { ui } from '@/styles/ui'
</script>

<template>
  <div :class="ui.layoutRoot">
    <div :class="ui.layoutSide" />
    <div :class="ui.layoutCenter">
      <router-view v-slot="{ Component }">
        <Transition name="view" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </div>
    <div :class="ui.layoutSide" />
  </div>
</template>
