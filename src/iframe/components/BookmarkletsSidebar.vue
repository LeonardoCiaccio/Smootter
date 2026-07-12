<script setup lang="ts">
import { computed } from 'vue'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import type { StoredBookmarklet, StoredCategory } from '@/shared/bookmarkletsDb'
import { buildCategoryTree } from '@/shared/categoryTree'
import { useFaviconCache } from '../composables/bookmarkletFavicons'
import BookmarkletsCategoryNode from './BookmarkletsCategoryNode.vue'

const props = defineProps<{
  categories: StoredCategory[]
  bookmarklets: StoredBookmarklet[]
  selectedId: string | null
}>()
const emit = defineEmits<{
  select: [id: string]
  add: []
  search: []
  delete: [id: string]
  deleteCategory: [id: string]
  move: [id: string, categoryId: string]
}>()

const sidebarTitle = chrome.i18n.getMessage('bookmarkletsCategoriesTitle')
const addLabel = chrome.i18n.getMessage('bookmarkletsAddNew')
const searchLabel = chrome.i18n.getMessage('bookmarkletsSearch')

// "AA/BB/CC" in a category's name reads as a path — see shared/categoryTree.
const tree = computed(() => buildCategoryTree(props.categories))

const { faviconsByDomain } = useFaviconCache(computed(() => props.bookmarklets))
</script>

<template>
  <div :class="ui.bookmarkletsSidebar">
    <div :class="ui.bookmarkletsSidebarHeader">
      <span :class="ui.bookmarkletsSidebarTitle">{{ sidebarTitle }}</span>
      <div :class="ui.bookmarkletsSidebarHeaderActions">
        <button type="button" :class="ui.toolbarIconButton" :title="searchLabel" @click="emit('search')">
          <MagnifyingGlassIcon class="h-4 w-4" />
        </button>
        <button type="button" :class="ui.toolbarIconButton" :title="addLabel" @click="emit('add')">
          <PlusIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <BookmarkletsCategoryNode
      v-for="node in tree"
      :key="node.fullPath"
      :node="node"
      :bookmarklets="props.bookmarklets"
      :selected-id="selectedId"
      :depth="0"
      :favicons-by-domain="faviconsByDomain"
      @select="(id) => emit('select', id)"
      @delete="(id) => emit('delete', id)"
      @delete-category="(id) => emit('deleteCategory', id)"
      @move="(id, categoryId) => emit('move', id, categoryId)"
    />
  </div>
</template>
