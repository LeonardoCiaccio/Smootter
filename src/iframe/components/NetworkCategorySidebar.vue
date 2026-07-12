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
  TagIcon,
} from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { NETWORK_OTHER_CATEGORY, type NetworkEntry } from '@/shared/messages'
import type { MimeCategoryRule } from '@/shared/preferences'

const props = defineProps<{
  entries: NetworkEntry[]
  categories: MimeCategoryRule[]
  selected: string
}>()
const emit = defineEmits<{ select: [category: string] }>()

const titleLabel = chrome.i18n.getMessage('networkCategoriesTitle')
const allLabel = chrome.i18n.getMessage('networkCategoryAll')
const otherLabel = chrome.i18n.getMessage('networkCategoryOther')

// Best-effort icon for a user-named category, matched by keyword — falls back to a plain tag
// for anything custom the user came up with that doesn't hint at a known kind.
function iconFor(name: string) {
  const key = name.toLowerCase()
  if (/image|immagin|photo/.test(key)) return PhotoIcon
  if (/video/.test(key)) return FilmIcon
  if (/audio|music/.test(key)) return MusicalNoteIcon
  if (/pdf|doc/.test(key)) return DocumentTextIcon
  if (/font/.test(key)) return LanguageIcon
  if (/wasm|webassembly/.test(key)) return CpuChipIcon
  if (/archiv|zip|rar|compress/.test(key)) return ArchiveBoxIcon
  if (/html|css|javascript|json|xml|script/.test(key)) return CodeBracketIcon
  return TagIcon
}

const options = computed(() => [
  { key: 'all', label: allLabel, icon: ListBulletIcon },
  ...props.categories.map((rule) => ({ key: rule.name, label: rule.name, icon: iconFor(rule.name) })),
  { key: NETWORK_OTHER_CATEGORY, label: otherLabel, icon: CubeIcon },
])

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
