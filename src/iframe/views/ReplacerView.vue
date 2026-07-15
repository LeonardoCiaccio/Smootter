<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ui } from '@/styles/ui'
import Breadcrumb from '../components/Breadcrumb.vue'
import ReplacerForm from '../components/ReplacerForm.vue'
import ReplacerSidebar from '../components/ReplacerSidebar.vue'
import ReplacerTagsSidebar from '../components/ReplacerTagsSidebar.vue'
import ReplacerResultsList from '../components/ReplacerResultsList.vue'
import ReplacerSearchPanel, { type ReplacerSearchState } from '../components/ReplacerSearchPanel.vue'
import { useToast } from '../plugins/toast'
import { replacerRefreshSignal } from '../composables/replacerRefresh'
import {
  deleteReplacer,
  deleteReplacerCategory,
  deleteReplacerTagEverywhere,
  getAllReplacerCategories,
  reconcileOrphanReplacers,
  saveReplacer,
  saveReplacerCategory,
  type StoredReplacer,
  type StoredReplacerCategory,
} from '@/shared/replacerDb'

const toast = useToast()

const replacers = ref<StoredReplacer[]>([])
const categories = ref<StoredReplacerCategory[]>([])
const selectedId = ref<string | null>(null)
const selectedTag = ref<string | null>(null)
const searchActive = ref(false)
// Owned here, not by ReplacerSearchPanel selecting a result unmounts that panel (the form
// takes its place), so its own local state would reset on every return trip.
const searchState = ref<ReplacerSearchState>({ query: '', aiResultIds: null, aiQueryUsed: '' })

// Categories always include the fixed "uncategorized" one (seeded by getAllReplacerCategories),
// so emptiness is purely about whether any replacer has been saved yet.
const isEmpty = computed(() => replacers.value.length === 0)
const selectedReplacer = computed(
  () => replacers.value.find((replacer) => replacer.id === selectedId.value) ?? null,
)
const tagSuggestions = computed(() => [...new Set(replacers.value.flatMap((replacer) => replacer.tags))])
const replacersForSelectedTag = computed(() =>
  selectedTag.value === null
    ? []
    : replacers.value.filter((replacer) => replacer.tags.includes(selectedTag.value as string)),
)
const selectedTagHeader = computed(() =>
  selectedTag.value === null ? '' : chrome.i18n.getMessage('bookmarkletsTagResultsHeader', [selectedTag.value]),
)

function onSaved(replacer: StoredReplacer): void {
  const index = replacers.value.findIndex((existing) => existing.id === replacer.id)
  replacers.value =
    index === -1
      ? [...replacers.value, replacer]
      : replacers.value.map((existing, i) => (i === index ? replacer : existing))
  selectedId.value = replacer.id
  toast.success(chrome.i18n.getMessage('replacerSaved'))
}

function onCategoryCreated(category: StoredReplacerCategory): void {
  categories.value = [...categories.value, category]
}

async function onTagDeleted(tag: string): Promise<void> {
  replacers.value = await deleteReplacerTagEverywhere(tag)
  if (selectedTag.value === tag) selectedTag.value = null
}

function onSelectReplacer(id: string): void {
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

async function onReplacerDeleted(id: string): Promise<void> {
  await deleteReplacer(id)
  replacers.value = replacers.value.filter((replacer) => replacer.id !== id)
  if (selectedId.value === id) selectedId.value = null
  toast.success(chrome.i18n.getMessage('replacerDeleted'))
}

// categoryPath is the dropped-on node's fullPath it may be an existing category's name, or
// just a structural path segment (e.g. "AA" when only "AA/BB" was ever created) that gets
// promoted into a real category here, on first use.
async function onReplacerMoved(id: string, categoryPath: string): Promise<void> {
  const replacer = replacers.value.find((existing) => existing.id === id)
  if (!replacer) return

  let category = categories.value.find((existing) => existing.name === categoryPath)
  if (!category) {
    category = { id: crypto.randomUUID(), name: categoryPath }
    await saveReplacerCategory(category)
    categories.value = [...categories.value, category]
  }
  if (replacer.categoryId === category.id) return

  const updated = { ...replacer, categoryId: category.id, updatedAt: Date.now() }
  await saveReplacer(updated)
  replacers.value = replacers.value.map((existing) => (existing.id === id ? updated : existing))
}

async function onCategoryDeleted(id: string): Promise<void> {
  replacers.value = await deleteReplacerCategory(id)
  categories.value = categories.value.filter((category) => category.id !== id)
  toast.success(chrome.i18n.getMessage('bookmarkletCategoryDeleted'))
}

async function reloadData(): Promise<void> {
  const allCategories = await getAllReplacerCategories()
  categories.value = allCategories
  // Needs categories first it reassigns any replacer with an unknown categoryId to "uncategorized".
  replacers.value = await reconcileOrphanReplacers(allCategories)
}

onMounted(reloadData)

// Imports can happen from the toolbar or Home's drop zone (both always mounted elsewhere).
watch(replacerRefreshSignal, reloadData)
</script>

<template>
  <div :class="ui.viewShell">
    <Breadcrumb view-key="replacer" />

    <div v-if="isEmpty" :class="ui.bookmarkletsEmptyWrapper">
      <ReplacerForm
        :categories="categories"
        :replacers="replacers"
        :tag-suggestions="tagSuggestions"
        :existing-replacer="null"
        @saved="onSaved"
        @category-created="onCategoryCreated"
      />
    </div>

    <div v-else :class="ui.bookmarkletsLayout">
      <ReplacerSidebar
        :categories="categories"
        :replacers="replacers"
        :selected-id="selectedId"
        @select="onSelectReplacer"
        @add="onAddNew"
        @search="onSearchOpened"
        @delete="onReplacerDeleted"
        @delete-category="onCategoryDeleted"
        @move="onReplacerMoved"
      />
      <div :class="ui.bookmarkletsMain">
        <div :class="ui.replacerWrapper">
          <ReplacerResultsList
            v-if="selectedTag"
            :header-text="selectedTagHeader"
            :replacers="replacersForSelectedTag"
            :categories="categories"
            :exclude-tag="selectedTag"
            @select="onSelectReplacer"
          />
          <ReplacerSearchPanel
            v-else-if="searchActive"
            v-model:state="searchState"
            :replacers="replacers"
            :categories="categories"
            @select="onSelectReplacer"
          />
          <ReplacerForm
            v-else
            :categories="categories"
            :replacers="replacers"
            :tag-suggestions="tagSuggestions"
            :existing-replacer="selectedReplacer"
            @saved="onSaved"
            @category-created="onCategoryCreated"
          />
        </div>
      </div>
      <ReplacerTagsSidebar :tags="tagSuggestions" :selected-tag="selectedTag" @delete="onTagDeleted" @select="onSelectTag" />
    </div>
  </div>
</template>
