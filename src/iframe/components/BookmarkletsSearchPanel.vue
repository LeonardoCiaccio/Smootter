<script setup lang="ts">
import { computed, ref } from 'vue'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import type { StoredBookmarklet, StoredCategory } from '@/shared/bookmarkletsDb'
import BookmarkletsResultsList from './BookmarkletsResultsList.vue'

const props = defineProps<{
  bookmarklets: StoredBookmarklet[]
  categories: StoredCategory[]
}>()
const emit = defineEmits<{ select: [id: string] }>()

const searchPlaceholder = chrome.i18n.getMessage('bookmarkletsSearchPlaceholder')
const noResultsText = chrome.i18n.getMessage('bookmarkletsSearchNoResults')

const query = ref('')

const results = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (needle === '') return []
  return props.bookmarklets.filter(
    (bookmarklet) =>
      bookmarklet.title.toLowerCase().includes(needle) ||
      bookmarklet.description.toLowerCase().includes(needle) ||
      bookmarklet.url.toLowerCase().includes(needle) ||
      bookmarklet.tags.some((tag) => tag.toLowerCase().includes(needle)),
  )
})
</script>

<template>
  <div>
    <div :class="ui.bookmarkletsSearchInputWrapper">
      <MagnifyingGlassIcon :class="ui.bookmarkletsSearchInputIcon" />
      <input v-model="query" type="text" autofocus :class="ui.bookmarkletsSearchInput" :placeholder="searchPlaceholder" />
    </div>

    <BookmarkletsResultsList
      v-if="query.trim() !== ''"
      :bookmarklets="results"
      :categories="categories"
      :no-results-text="noResultsText"
      @select="(id) => emit('select', id)"
    />
  </div>
</template>
