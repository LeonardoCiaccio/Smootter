<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'

const label = chrome.i18n.getMessage('createFirstTool')
</script>

<template>
  <RouterLink to="/builder" :class="ui.toolsEmptyButton">
    <PlusIcon :class="ui.toolsEmptyIcon" />
    <span>{{ label }}</span>
  </RouterLink>
</template>
