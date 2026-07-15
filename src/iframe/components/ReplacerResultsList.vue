<script setup lang="ts">
import { computed } from 'vue'
import { ui } from '@/styles/ui'
import type { StoredReplacer, StoredReplacerCategory } from '@/shared/replacerDb'

const props = defineProps<{
  headerText?: string
  replacers: StoredReplacer[]
  categories: StoredReplacerCategory[]
  // Hides this one tag from each record's tag chips used by the tag-filter view, where the
  // selected tag is already implied by being in this list.
  excludeTag?: string
  noResultsText?: string
}>()
const emit = defineEmits<{ select: [id: string] }>()

function categoryName(categoryId: string): string {
  return props.categories.find((category) => category.id === categoryId)?.name ?? ''
}

function visibleTags(replacer: StoredReplacer): string[] {
  return props.excludeTag ? replacer.tags.filter((tag) => tag !== props.excludeTag) : replacer.tags
}

// The replacement text can be arbitrarily long a short preview is what's actually scannable
// in a results list, not the whole thing.
const TEXT_SNIPPET_LENGTH = 140
function textSnippet(replacer: StoredReplacer): string {
  const text = replacer.text.trim()
  return text.length > TEXT_SNIPPET_LENGTH ? `${text.slice(0, TEXT_SNIPPET_LENGTH)}…` : text
}

// Grouped visually by category, alphabetical within it a scannable, ordered record list.
const sorted = computed(() =>
  [...props.replacers].sort((a, b) => {
    const categoryCompare = categoryName(a.categoryId).localeCompare(categoryName(b.categoryId))
    return categoryCompare !== 0 ? categoryCompare : a.title.localeCompare(b.title)
  }),
)
</script>

<template>
  <div>
    <h1 v-if="headerText" :class="ui.bookmarkletsTagResultsHeader">{{ headerText }}</h1>

    <p v-if="sorted.length === 0 && noResultsText" :class="ui.toolsNoResults">{{ noResultsText }}</p>

    <div v-else :class="ui.bookmarkletsTagResultsList">
      <div
        v-for="replacer in sorted"
        :key="replacer.id"
        :class="ui.bookmarkletsTagResultRecord"
        @click="emit('select', replacer.id)"
      >
        <div :class="ui.bookmarkletsTagResultTopRow">
          <span :class="ui.bookmarkletsTagResultCategory">{{ categoryName(replacer.categoryId) }}</span>
        </div>

        <div :class="ui.bookmarkletsTagResultTitleRow">
          <span :class="ui.bookmarkletsTagResultTitle">{{ replacer.title }}</span>
          <span :class="ui.tagChip">{{ replacer.placeholder }}</span>
        </div>

        <p v-if="replacer.text.trim() !== ''" :class="ui.bookmarkletsTagResultDescription">
          {{ textSnippet(replacer) }}
        </p>

        <div v-if="visibleTags(replacer).length > 0" :class="ui.bookmarkletsTagResultTags">
          <span v-for="tag in visibleTags(replacer)" :key="tag" :class="ui.tagChip">{{ tag }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
