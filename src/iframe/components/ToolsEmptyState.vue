<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'

const label = chrome.i18n.getMessage('createFirstTool')
</script>

<template>
  <RouterLink to="/builder" :class="ui.toolsEmptyButton">
    <span :class="ui.toolsEmptyIconWrap">
      <PlusIcon :class="ui.toolsEmptyIcon" />
    </span>
    <span :class="ui.toolsEmptyLabel">{{ label }}</span>
  </RouterLink>
</template>
