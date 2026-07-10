<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import emptyStateIllustration from '@/assets/empty-state.svg'

const label = chrome.i18n.getMessage('createFirstTool')
</script>

<template>
  <div :class="ui.toolsEmptyWrapper">
    <img :src="emptyStateIllustration" :class="ui.toolsEmptyIllustration" alt="" />
    <RouterLink to="/builder" :class="ui.toolsEmptyButton">
      <PlusIcon :class="ui.toolsEmptyIcon" />
      <span>{{ label }}</span>
    </RouterLink>
  </div>
</template>
