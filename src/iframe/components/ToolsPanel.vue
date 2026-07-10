<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ui } from '@/styles/ui'
import ToolsEmptyState from './ToolsEmptyState.vue'
import ToolCard from './ToolCard.vue'
import { getAllTools, type StoredTool } from '@/shared/toolsDb'

const tools = ref<StoredTool[]>([])
const hasTools = computed(() => tools.value.length > 0)

onMounted(async () => {
  tools.value = await getAllTools()
})

function onDeleted(id: string): void {
  tools.value = tools.value.filter((tool) => tool.id !== id)
}
</script>

<template>
  <div :class="ui.toolsPanel">
    <ToolsEmptyState v-if="!hasTools" />
    <div v-else :class="ui.toolsList">
      <ToolCard v-for="tool in tools" :key="tool.id" :tool="tool" @deleted="onDeleted" />
    </div>
  </div>
</template>
