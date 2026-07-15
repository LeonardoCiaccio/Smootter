<script setup lang="ts">
import { computed } from 'vue'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { UNCATEGORIZED_REPLACER_CATEGORY_ID, type StoredReplacer, type StoredReplacerCategory } from '@/shared/replacerDb'
import { buildCategoryTree } from '@/shared/categoryTree'
import ReplacerCategoryNode from './ReplacerCategoryNode.vue'

const props = defineProps<{
  categories: StoredReplacerCategory[]
  replacers: StoredReplacer[]
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

const sidebarTitle = chrome.i18n.getMessage('replacerCategoriesTitle')
const addLabel = chrome.i18n.getMessage('replacerAddNew')
const searchLabel = chrome.i18n.getMessage('bookmarkletsSearch')

// "AA/BB/CC" in a category's name reads as a path see shared/categoryTree.
const tree = computed(() => buildCategoryTree(props.categories, UNCATEGORIZED_REPLACER_CATEGORY_ID))
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

    <ReplacerCategoryNode
      v-for="node in tree"
      :key="node.fullPath"
      :node="node"
      :replacers="props.replacers"
      :selected-id="selectedId"
      :depth="0"
      @select="(id) => emit('select', id)"
      @delete="(id) => emit('delete', id)"
      @delete-category="(id) => emit('deleteCategory', id)"
      @move="(id, categoryId) => emit('move', id, categoryId)"
    />
  </div>
</template>
