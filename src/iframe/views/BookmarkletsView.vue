<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { ui } from '@/styles/ui'
import Breadcrumb from '../components/Breadcrumb.vue'
import BookmarkletForm from '../components/BookmarkletForm.vue'
import BookmarkletsSidebar from '../components/BookmarkletsSidebar.vue'
import BookmarkletsTagsSidebar from '../components/BookmarkletsTagsSidebar.vue'
import BookmarkletsResultsList from '../components/BookmarkletsResultsList.vue'
import BookmarkletsSearchPanel from '../components/BookmarkletsSearchPanel.vue'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { useToast } from '../plugins/toast'
import {
  deleteBookmarklet,
  deleteCategory,
  deleteTagEverywhere,
  getAllCategories,
  reconcileOrphanBookmarklets,
  saveBookmarklet,
  saveCategory,
  type StoredBookmarklet,
  type StoredCategory,
} from '@/shared/bookmarkletsDb'
import { bookmarkletsRefreshSignal } from '../composables/bookmarkletsRefresh'

const channel = inject(channelKey)
const toast = useToast()

const currentUrl = ref('')
const pageTitle = ref('')
const pageFaviconUrl = ref<string | undefined>(undefined)
const bookmarklets = ref<StoredBookmarklet[]>([])
const categories = ref<StoredCategory[]>([])
const selectedId = ref<string | null>(null)
const selectedTag = ref<string | null>(null)
const searchActive = ref(false)

// Categories always include the fixed "uncategorized" one (seeded by getAllCategories), so
// emptiness is purely about whether any bookmarklet has been saved yet.
const isEmpty = computed(() => bookmarklets.value.length === 0)
const selectedBookmarklet = computed(
  () => bookmarklets.value.find((bookmarklet) => bookmarklet.id === selectedId.value) ?? null,
)
const tagSuggestions = computed(() => [...new Set(bookmarklets.value.flatMap((bookmarklet) => bookmarklet.tags))])
const bookmarkletsForSelectedTag = computed(() =>
  selectedTag.value === null
    ? []
    : bookmarklets.value.filter((bookmarklet) => bookmarklet.tags.includes(selectedTag.value as string)),
)
const selectedTagHeader = computed(() =>
  selectedTag.value === null ? '' : chrome.i18n.getMessage('bookmarkletsTagResultsHeader', [selectedTag.value]),
)
// The current page may already be saved — the form edits that entry in place instead of duplicating it.
const existingForCurrentUrl = computed(
  () => bookmarklets.value.find((bookmarklet) => bookmarklet.url === currentUrl.value) ?? null,
)
// A bookmarklet picked from the sidebar/tag results always opens straight into edit mode;
// with nothing picked, the form falls back to whatever's already saved for the live page.
const formExistingBookmarklet = computed(() => selectedBookmarklet.value ?? existingForCurrentUrl.value)
// The sidebar highlight must follow the same fallback — otherwise the form silently opens in
// edit mode (current page already saved) while the sidebar shows nothing selected.
const highlightedId = computed(() => selectedId.value ?? existingForCurrentUrl.value?.id ?? null)

function onSaved(bookmarklet: StoredBookmarklet): void {
  const index = bookmarklets.value.findIndex((existing) => existing.id === bookmarklet.id)
  bookmarklets.value =
    index === -1
      ? [...bookmarklets.value, bookmarklet]
      : bookmarklets.value.map((existing, i) => (i === index ? bookmarklet : existing))
  toast.success(chrome.i18n.getMessage('bookmarkletsSaved'))
}

function onCategoryCreated(category: StoredCategory): void {
  categories.value = [...categories.value, category]
}

async function onTagDeleted(tag: string): Promise<void> {
  bookmarklets.value = await deleteTagEverywhere(tag)
  if (selectedTag.value === tag) selectedTag.value = null
}

function onSelectBookmarklet(id: string): void {
  selectedId.value = id
  selectedTag.value = null
  searchActive.value = false
}

function onSelectTag(tag: string): void {
  selectedTag.value = tag
  selectedId.value = null
  searchActive.value = false
}

function onAddNew(): void {
  selectedId.value = null
  selectedTag.value = null
  searchActive.value = false
}

function onSearchOpened(): void {
  searchActive.value = true
  selectedId.value = null
  selectedTag.value = null
}

async function onBookmarkletDeleted(id: string): Promise<void> {
  await deleteBookmarklet(id)
  bookmarklets.value = bookmarklets.value.filter((bookmarklet) => bookmarklet.id !== id)
  if (selectedId.value === id) selectedId.value = null
  toast.success(chrome.i18n.getMessage('bookmarkletDeleted'))
}

// categoryPath is the dropped-on node's fullPath — it may be an existing category's name, or
// just a structural path segment (e.g. "AA" when only "AA/BB" was ever created) that gets
// promoted into a real category here, on first use.
async function onBookmarkletMoved(id: string, categoryPath: string): Promise<void> {
  const bookmarklet = bookmarklets.value.find((existing) => existing.id === id)
  if (!bookmarklet) return

  let category = categories.value.find((existing) => existing.name === categoryPath)
  if (!category) {
    category = { id: crypto.randomUUID(), name: categoryPath }
    await saveCategory(category)
    categories.value = [...categories.value, category]
  }
  if (bookmarklet.categoryId === category.id) return

  const updated = { ...bookmarklet, categoryId: category.id, updatedAt: Date.now() }
  await saveBookmarklet(updated)
  bookmarklets.value = bookmarklets.value.map((existing) => (existing.id === id ? updated : existing))
}

async function onCategoryDeleted(id: string): Promise<void> {
  bookmarklets.value = await deleteCategory(id)
  categories.value = categories.value.filter((category) => category.id !== id)
  toast.success(chrome.i18n.getMessage('bookmarkletCategoryDeleted'))
}

async function reloadData(): Promise<void> {
  const allCategories = await getAllCategories()
  categories.value = allCategories
  // Needs categories first — it reassigns any bookmarklet with an unknown categoryId to "uncategorized".
  bookmarklets.value = await reconcileOrphanBookmarklets(allCategories)
}

onMounted(async () => {
  const [pageResponse] = await Promise.all([channel?.send({ type: 'getCurrentPage' }), reloadData()])

  if (pageResponse?.type === 'currentPage') {
    currentUrl.value = pageResponse.url ?? ''
    pageTitle.value = pageResponse.title ?? ''
    pageFaviconUrl.value = pageResponse.favIconUrl
  }
})

// Imports can happen from the toolbar or Home's drop zone (both always mounted elsewhere).
watch(bookmarkletsRefreshSignal, reloadData)
</script>

<template>
  <div :class="ui.viewShell">
    <Breadcrumb view-key="bookmarklets" />

    <div v-if="isEmpty" :class="ui.bookmarkletsWrapper">
      <BookmarkletForm
        :current-url="currentUrl"
        :initial-title="pageTitle"
        :categories="categories"
        :tag-suggestions="tagSuggestions"
        :existing-bookmarklet="existingForCurrentUrl"
        :favicon-url="pageFaviconUrl"
        @saved="onSaved"
        @category-created="onCategoryCreated"
      />
    </div>

    <div v-else :class="ui.bookmarkletsLayout">
      <BookmarkletsSidebar
        :categories="categories"
        :bookmarklets="bookmarklets"
        :selected-id="highlightedId"
        @select="onSelectBookmarklet"
        @add="onAddNew"
        @search="onSearchOpened"
        @delete="onBookmarkletDeleted"
        @delete-category="onCategoryDeleted"
        @move="onBookmarkletMoved"
      />
      <div :class="ui.bookmarkletsMain">
        <div :class="ui.bookmarkletsWrapper">
          <BookmarkletsResultsList
            v-if="selectedTag"
            :header-text="selectedTagHeader"
            :bookmarklets="bookmarkletsForSelectedTag"
            :categories="categories"
            :exclude-tag="selectedTag"
            @select="onSelectBookmarklet"
          />
          <BookmarkletsSearchPanel
            v-else-if="searchActive"
            :bookmarklets="bookmarklets"
            :categories="categories"
            @select="onSelectBookmarklet"
          />
          <BookmarkletForm
            v-else
            :current-url="currentUrl"
            :initial-title="pageTitle"
            :categories="categories"
            :tag-suggestions="tagSuggestions"
            :existing-bookmarklet="formExistingBookmarklet"
            :favicon-url="pageFaviconUrl"
            @saved="onSaved"
            @category-created="onCategoryCreated"
          />
        </div>
      </div>
      <BookmarkletsTagsSidebar :tags="tagSuggestions" :selected-tag="selectedTag" @delete="onTagDeleted" @select="onSelectTag" />
    </div>
  </div>
</template>
