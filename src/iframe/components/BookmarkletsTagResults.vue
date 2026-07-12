<script setup lang="ts">
import { computed } from 'vue'
import { ui } from '@/styles/ui'
import type { StoredBookmarklet, StoredCategory } from '@/shared/bookmarkletsDb'

const props = defineProps<{
  tag: string
  bookmarklets: StoredBookmarklet[]
  categories: StoredCategory[]
}>()
const emit = defineEmits<{ select: [id: string] }>()

const headerText = computed(() => chrome.i18n.getMessage('bookmarkletsTagResultsHeader', [props.tag]))

function categoryName(categoryId: string): string {
  return props.categories.find((category) => category.id === categoryId)?.name ?? ''
}

// Grouped visually by category, alphabetical within it — a scannable, ordered record list.
const sorted = computed(() =>
  [...props.bookmarklets].sort((a, b) => {
    const categoryCompare = categoryName(a.categoryId).localeCompare(categoryName(b.categoryId))
    return categoryCompare !== 0 ? categoryCompare : a.title.localeCompare(b.title)
  }),
)
</script>

<template>
  <div>
    <h1 :class="ui.bookmarkletsTagResultsHeader">{{ headerText }}</h1>

    <div :class="ui.bookmarkletsTagResultsList">
      <div
        v-for="bookmarklet in sorted"
        :key="bookmarklet.id"
        :class="ui.bookmarkletsTagResultRecord"
        @click="emit('select', bookmarklet.id)"
      >
        <span :class="ui.bookmarkletsTagResultCategory">{{ categoryName(bookmarklet.categoryId) }}</span>
        <span :class="ui.bookmarkletsTagResultTitle">{{ bookmarklet.title }}</span>
        <p v-if="bookmarklet.description" :class="ui.bookmarkletsTagResultDescription">
          {{ bookmarklet.description }}
        </p>
        <a
          :href="bookmarklet.url"
          target="_blank"
          rel="noopener noreferrer"
          :class="ui.bookmarkletDetailLink"
          @click.stop
        >
          {{ bookmarklet.url }}
        </a>
      </div>
    </div>
  </div>
</template>
