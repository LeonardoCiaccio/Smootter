<script setup lang="ts">
import { computed } from 'vue'
import { GlobeAltIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import type { StoredBookmarklet, StoredCategory } from '@/shared/bookmarkletsDb'
import { useFaviconCache } from '../composables/bookmarkletFavicons'

const props = defineProps<{
  headerText?: string
  bookmarklets: StoredBookmarklet[]
  categories: StoredCategory[]
  // Hides this one tag from each record's tag chips — used by the tag-filter view, where
  // the selected tag is already implied by being in this list.
  excludeTag?: string
  noResultsText?: string
}>()
const emit = defineEmits<{ select: [id: string] }>()

function categoryName(categoryId: string): string {
  return props.categories.find((category) => category.id === categoryId)?.name ?? ''
}

function visibleTags(bookmarklet: StoredBookmarklet): string[] {
  return props.excludeTag ? bookmarklet.tags.filter((tag) => tag !== props.excludeTag) : bookmarklet.tags
}

// Grouped visually by category, alphabetical within it — a scannable, ordered record list.
const sorted = computed(() =>
  [...props.bookmarklets].sort((a, b) => {
    const categoryCompare = categoryName(a.categoryId).localeCompare(categoryName(b.categoryId))
    return categoryCompare !== 0 ? categoryCompare : a.title.localeCompare(b.title)
  }),
)

const { faviconFor } = useFaviconCache(computed(() => props.bookmarklets))
</script>

<template>
  <div>
    <h1 v-if="headerText" :class="ui.bookmarkletsTagResultsHeader">{{ headerText }}</h1>

    <p v-if="sorted.length === 0 && noResultsText" :class="ui.toolsNoResults">{{ noResultsText }}</p>

    <div v-else :class="ui.bookmarkletsTagResultsList">
      <div
        v-for="bookmarklet in sorted"
        :key="bookmarklet.id"
        :class="ui.bookmarkletsTagResultRecord"
        @click="emit('select', bookmarklet.id)"
      >
        <span :class="ui.bookmarkletsTagResultCategory">{{ categoryName(bookmarklet.categoryId) }}</span>

        <div :class="ui.bookmarkletsTagResultTitleRow">
          <img
            v-if="faviconFor(bookmarklet.url)"
            :src="faviconFor(bookmarklet.url)"
            :class="ui.bookmarkletsSidebarItemFavicon"
            alt=""
          />
          <GlobeAltIcon v-else :class="ui.bookmarkletsSidebarItemFaviconFallback" />
          <span :class="ui.bookmarkletsTagResultTitle">{{ bookmarklet.title }}</span>
        </div>

        <p v-if="bookmarklet.description" :class="ui.bookmarkletsTagResultDescription">
          {{ bookmarklet.description }}
        </p>

        <div v-if="visibleTags(bookmarklet).length > 0" :class="ui.bookmarkletsTagResultTags">
          <span v-for="tag in visibleTags(bookmarklet)" :key="tag" :class="ui.tagChip">{{ tag }}</span>
        </div>

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
