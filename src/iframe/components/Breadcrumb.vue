<script setup lang="ts">
import { computed } from 'vue'
import { ui } from '@/styles/ui'

const props = defineProps<{ viewKey: string }>()

const toolsLabel = chrome.i18n.getMessage('tools')
const currentLabel = computed(() => chrome.i18n.getMessage(props.viewKey))
</script>

<template>
  <div :class="ui.breadcrumb">
    <RouterLink to="/tools" :class="ui.breadcrumbHome">{{ toolsLabel }}</RouterLink>
    <span :class="ui.breadcrumbSeparator">/</span>
    <span :class="ui.breadcrumbCurrent">{{ currentLabel }}</span>
    <slot />
  </div>
</template>
