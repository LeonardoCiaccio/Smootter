<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import ToolsEmptyState from './ToolsEmptyState.vue'
import AddToolCard from './AddToolCard.vue'
import ToolCard from './ToolCard.vue'
import { getAllTools, type StoredTool } from '@/shared/toolsDb'
import { toolsRefreshSignal } from '../composables/toolsRefresh'

const tools = ref<StoredTool[]>([])
const hasTools = computed(() => tools.value.length > 0)

// Search only earns its place once the list is long enough to need it.
const SEARCH_THRESHOLD = 15
const searchQuery = ref('')
const showSearch = computed(() => tools.value.length > SEARCH_THRESHOLD)

const filteredTools = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (query === '') return tools.value
  return tools.value.filter(
    (tool) =>
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.scopeTargets.toLowerCase().includes(query),
  )
})

const searchPlaceholder = chrome.i18n.getMessage('toolsSearchPlaceholder')
const searchClearLabel = chrome.i18n.getMessage('toolsSearchClear')
const noResultsText = chrome.i18n.getMessage('toolsNoResults')

onMounted(async () => {
  tools.value = await getAllTools()
})

// Imports happen from the toolbar (always mounted), outside this component.
watch(toolsRefreshSignal, async () => {
  tools.value = await getAllTools()
})

function onDeleted(id: string): void {
  tools.value = tools.value.filter((tool) => tool.id !== id)
}
</script>

<template>
  <div :class="ui.toolsPanel">
    <ToolsEmptyState v-if="!hasTools" />
    <template v-else>
      <div v-if="showSearch" :class="ui.toolsSearchWrapper">
        <MagnifyingGlassIcon :class="ui.toolsSearchIcon" />
        <input v-model="searchQuery" type="text" :placeholder="searchPlaceholder" :class="ui.toolsSearchInput" />
        <button
          v-if="searchQuery !== ''"
          type="button"
          :class="ui.toolsSearchClear"
          :aria-label="searchClearLabel"
          @click="searchQuery = ''"
        >
          <XMarkIcon :class="ui.toolsSearchClearIcon" />
        </button>
      </div>

      <div :class="ui.toolsScrollArea">
        <p v-if="filteredTools.length === 0" :class="ui.toolsNoResults">{{ noResultsText }}</p>
        <div v-else :class="ui.toolsList">
          <AddToolCard />
          <ToolCard v-for="tool in filteredTools" :key="tool.id" :tool="tool" @deleted="onDeleted" />
        </div>
      </div>
    </template>
  </div>
</template>
