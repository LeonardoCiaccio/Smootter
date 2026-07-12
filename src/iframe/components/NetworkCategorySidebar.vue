<script setup lang="ts">
import { computed } from 'vue'
import { CubeIcon, DocumentTextIcon, ListBulletIcon, PhotoIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import type { NetworkEntry, NetworkEntryCategory } from '@/shared/messages'

const props = defineProps<{
  entries: NetworkEntry[]
  selected: NetworkEntryCategory | 'all'
}>()
const emit = defineEmits<{ select: [category: NetworkEntryCategory | 'all'] }>()

const titleLabel = chrome.i18n.getMessage('networkCategoriesTitle')

const options = [
  { key: 'all' as const, label: chrome.i18n.getMessage('networkCategoryAll'), icon: ListBulletIcon },
  { key: 'media' as const, label: chrome.i18n.getMessage('networkCategoryMedia'), icon: PhotoIcon },
  { key: 'document' as const, label: chrome.i18n.getMessage('networkCategoryDocuments'), icon: DocumentTextIcon },
  { key: 'other' as const, label: chrome.i18n.getMessage('networkCategoryOther'), icon: CubeIcon },
]

const countFor = computed(() => {
  const counts: Record<string, number> = { all: props.entries.length, media: 0, document: 0, other: 0 }
  for (const entry of props.entries) counts[entry.category]++
  return counts
})
</script>

<template>
  <div :class="ui.networkSidebar">
    <span :class="ui.networkSidebarTitle">{{ titleLabel }}</span>

    <button
      v-for="option in options"
      :key="option.key"
      type="button"
      :class="[ui.networkCategoryButton, selected === option.key && ui.networkCategoryButtonActive]"
      @click="emit('select', option.key)"
    >
      <component :is="option.icon" :class="ui.networkCategoryIcon" />
      <span :class="ui.networkCategoryLabel">{{ option.label }}</span>
      <span :class="ui.networkCategoryCount">{{ countFor[option.key] }}</span>
    </button>
  </div>
</template>
