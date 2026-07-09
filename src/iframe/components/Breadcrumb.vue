<script setup lang="ts">
import { computed } from 'vue'
import { ui } from '@/styles/ui'

const props = defineProps<{ viewKey: string }>()

const homeLabel = chrome.i18n.getMessage('home')
const currentLabel = computed(() => chrome.i18n.getMessage(props.viewKey))
</script>

<template>
  <div :class="ui.breadcrumb">
    <RouterLink to="/" :class="ui.breadcrumbHome">{{ homeLabel }}</RouterLink>
    <span :class="ui.breadcrumbSeparator">/</span>
    <span :class="ui.breadcrumbCurrent">{{ currentLabel }}</span>
  </div>
</template>
