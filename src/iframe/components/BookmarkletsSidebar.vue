<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { ensureFavicon, type StoredBookmarklet, type StoredCategory } from '@/shared/bookmarkletsDb'
import { buildCategoryTree } from '@/shared/categoryTree'
import { hostnameOf } from '@/shared/url'
import BookmarkletsCategoryNode from './BookmarkletsCategoryNode.vue'

const props = defineProps<{
  categories: StoredCategory[]
  bookmarklets: StoredBookmarklet[]
  selectedId: string | null
}>()
const emit = defineEmits<{
  select: [id: string]
  add: []
  delete: [id: string]
  deleteCategory: [id: string]
  move: [id: string, categoryId: string]
}>()

const sidebarTitle = chrome.i18n.getMessage('bookmarkletsCategoriesTitle')
const addLabel = chrome.i18n.getMessage('bookmarkletsAddNew')

// "AA/BB/CC" in a category's name reads as a path — see shared/categoryTree.
const tree = computed(() => buildCategoryTree(props.categories))

// Cache-only lookup (no liveFaviconUrl) — the sidebar has no live tab for most of these
// entries, so it only ever shows what's already cached, never fetches.
const faviconsByDomain = ref<Record<string, string>>({})

watch(
  () => props.bookmarklets,
  async (list) => {
    const domains = [...new Set(list.map((bookmarklet) => hostnameOf(bookmarklet.url)).filter((domain) => domain !== ''))]
    const missing = domains.filter((domain) => !(domain in faviconsByDomain.value))
    if (missing.length === 0) return

    const entries = await Promise.all(
      missing.map(async (domain) => [domain, await ensureFavicon(domain)] as const),
    )
    const next = { ...faviconsByDomain.value }
    for (const [domain, dataUrl] of entries) {
      if (dataUrl) next[domain] = dataUrl
    }
    faviconsByDomain.value = next
  },
  { immediate: true },
)
</script>

<template>
  <div :class="ui.bookmarkletsSidebar">
    <div :class="ui.bookmarkletsSidebarHeader">
      <span :class="ui.bookmarkletsSidebarTitle">{{ sidebarTitle }}</span>
      <button type="button" :class="ui.toolbarIconButton" :title="addLabel" @click="emit('add')">
        <PlusIcon class="h-4 w-4" />
      </button>
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
