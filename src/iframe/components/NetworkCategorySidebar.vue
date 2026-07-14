<script setup lang="ts">
import { computed } from 'vue'
import {
  ArchiveBoxIcon,
  CodeBracketIcon,
  CpuChipIcon,
  CubeIcon,
  DocumentTextIcon,
  FilmIcon,
  LanguageIcon,
  ListBulletIcon,
  MusicalNoteIcon,
  PhotoIcon,
} from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { NETWORK_OTHER_CATEGORY, type NetworkEntry } from '@/shared/messages'
import { NETWORK_MIME_CATEGORIES } from '@/shared/networkCategories'

const props = defineProps<{
  entries: NetworkEntry[]
  selected: string
}>()
const emit = defineEmits<{ select: [category: string] }>()

const titleLabel = chrome.i18n.getMessage('networkCategoriesTitle')
const allLabel = chrome.i18n.getMessage('networkCategoryAll')
const otherLabel = chrome.i18n.getMessage('networkCategoryOther')

// Fixed set, fixed icons direct lookup, no guessing needed.
const ICON_BY_CATEGORY: Record<string, typeof CodeBracketIcon> = {
  HTML: CodeBracketIcon,
  CSS: CodeBracketIcon,
  JavaScript: CodeBracketIcon,
  JSON: CodeBracketIcon,
  XML: CodeBracketIcon,
  Images: PhotoIcon,
  Video: FilmIcon,
  Audio: MusicalNoteIcon,
  PDF: DocumentTextIcon,
  Documents: DocumentTextIcon,
  Fonts: LanguageIcon,
  WebAssembly: CpuChipIcon,
  Archives: ArchiveBoxIcon,
}

const options = [
  { key: 'all', label: allLabel, icon: ListBulletIcon },
  ...NETWORK_MIME_CATEGORIES.map((rule) => ({ key: rule.name, label: rule.name, icon: ICON_BY_CATEGORY[rule.name] ?? CubeIcon })),
  { key: NETWORK_OTHER_CATEGORY, label: otherLabel, icon: CubeIcon },
]

const countFor = computed(() => {
  const counts: Record<string, number> = { all: props.entries.length }
  for (const entry of props.entries) counts[entry.category] = (counts[entry.category] ?? 0) + 1
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
      <span :class="ui.networkCategoryCount">{{ countFor[option.key] ?? 0 }}</span>
    </button>
  </div>
</template>
