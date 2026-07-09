<script setup lang="ts">
import { computed } from 'vue'
import { ui } from '@/styles/ui'
import ToolsEmptyState from './ToolsEmptyState.vue'

interface Tool {
  id: string
}

const props = withDefaults(defineProps<{ tools?: Tool[] }>(), { tools: () => [] })

const hasTools = computed(() => props.tools.length > 0)
</script>

<template>
  <div :class="ui.toolsPanel">
    <ToolsEmptyState v-if="!hasTools" />
    <!-- else: list view, added once tools are wired to a real data source -->
  </div>
</template>
