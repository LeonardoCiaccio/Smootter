<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'

const props = defineProps<{ viewKey: string }>()

const label = computed(() => chrome.i18n.getMessage(props.viewKey))
</script>

<template>
  <RouterLink to="/" :class="ui.breadcrumb">
    <ArrowLeftIcon :class="ui.breadcrumbIcon" />
    <span>{{ label }}</span>
  </RouterLink>
</template>
