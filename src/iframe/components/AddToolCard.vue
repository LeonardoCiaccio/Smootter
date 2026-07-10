<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'

const label = chrome.i18n.getMessage('addTool')
</script>

<template>
  <RouterLink to="/builder" :class="ui.addToolCard">
    <PlusIcon :class="ui.addToolCardIcon" />
    <span :class="ui.addToolCardLabel">{{ label }}</span>
  </RouterLink>
</template>
