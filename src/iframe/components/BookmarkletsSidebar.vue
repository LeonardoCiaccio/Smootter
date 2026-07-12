<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronRightIcon, FolderIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { UNCATEGORIZED_CATEGORY_ID, type StoredBookmarklet, type StoredCategory } from '@/shared/bookmarkletsDb'

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
}>()

const sidebarTitle = chrome.i18n.getMessage('bookmarkletsCategoriesTitle')
const addLabel = chrome.i18n.getMessage('bookmarkletsAddNew')
const deleteLabel = chrome.i18n.getMessage('toolDelete')
const deleteConfirmLabel = chrome.i18n.getMessage('bookmarkletsDeleteConfirm')
const categoryDeleteConfirmLabel = chrome.i18n.getMessage('bookmarkletsCategoryDeleteConfirm')

// Every category stays listed even once empty — it only disappears if the user explicitly deletes it.
// "uncategorized" is always present (seeded by getAllCategories) and can't be deleted. Every
// bookmarklet is guaranteed to have a categoryId matching a known category — reconcileOrphanBookmarklets
// fixes stale/unknown ones on load — so a plain equality match is enough here.
const groups = computed(() =>
  props.categories.map((category) => ({
    category,
    items: props.bookmarklets.filter((bookmarklet) => bookmarklet.categoryId === category.id),
  })),
)

// Expanded by default — collapsing is an explicit user action, tracked per category id.
const collapsedIds = ref(new Set<string>())

function toggleCollapsed(categoryId: string): void {
  const next = new Set(collapsedIds.value)
  if (next.has(categoryId)) next.delete(categoryId)
  else next.add(categoryId)
  collapsedIds.value = next
}

// Delete needs two clicks: the first arms it (auto-disarms after a few seconds), the second deletes.
const confirmingId = ref<string | null>(null)
let disarmTimer: ReturnType<typeof setTimeout> | undefined

function onDeleteClick(id: string): void {
  clearTimeout(disarmTimer)
  if (confirmingId.value !== id) {
    confirmingId.value = id
    disarmTimer = setTimeout(() => (confirmingId.value = null), 3000)
    return
  }
  confirmingId.value = null
  emit('delete', id)
}

const confirmingCategoryId = ref<string | null>(null)
let categoryDisarmTimer: ReturnType<typeof setTimeout> | undefined

function onDeleteCategoryClick(id: string): void {
  clearTimeout(categoryDisarmTimer)
  if (confirmingCategoryId.value !== id) {
    confirmingCategoryId.value = id
    categoryDisarmTimer = setTimeout(() => (confirmingCategoryId.value = null), 3000)
    return
  }
  confirmingCategoryId.value = null
  emit('deleteCategory', id)
}
</script>

<template>
  <div :class="ui.bookmarkletsSidebar">
    <div :class="ui.bookmarkletsSidebarHeader">
      <span :class="ui.bookmarkletsSidebarTitle">{{ sidebarTitle }}</span>
      <button type="button" :class="ui.toolbarIconButton" :title="addLabel" @click="emit('add')">
        <PlusIcon class="h-4 w-4" />
      </button>
    </div>

    <div v-for="group in groups" :key="group.category.id" :class="ui.bookmarkletsCategoryGroup">
      <div :class="ui.bookmarkletsSidebarRow">
        <button type="button" :class="ui.bookmarkletsCategoryHeader" @click="toggleCollapsed(group.category.id)">
          <ChevronRightIcon
            :class="[ui.bookmarkletsCategoryChevron, !collapsedIds.has(group.category.id) && ui.bookmarkletsCategoryChevronOpen]"
          />
          <FolderIcon :class="ui.bookmarkletsCategoryIcon" />
          <span :class="ui.bookmarkletsCategoryName">{{ group.category.name }}</span>
        </button>
        <button
          v-if="group.category.id !== UNCATEGORIZED_CATEGORY_ID"
          type="button"
          :class="confirmingCategoryId === group.category.id ? ui.toolCardDeleteConfirm : ui.toolCardActionButton"
          :title="confirmingCategoryId === group.category.id ? categoryDeleteConfirmLabel : deleteLabel"
          @click.stop="onDeleteCategoryClick(group.category.id)"
        >
          <TrashIcon :class="ui.toolCardIcon" />
        </button>
      </div>

      <template v-if="!collapsedIds.has(group.category.id)">
        <div v-for="bookmarklet in group.items" :key="bookmarklet.id" :class="ui.bookmarkletsSidebarRow">
          <button
            type="button"
            :class="[ui.bookmarkletsSidebarItem, bookmarklet.id === props.selectedId && ui.bookmarkletsSidebarItemActive]"
            :title="bookmarklet.title"
            @click="emit('select', bookmarklet.id)"
          >
            {{ bookmarklet.title }}
          </button>
          <button
            type="button"
            :class="confirmingId === bookmarklet.id ? ui.toolCardDeleteConfirm : ui.toolCardActionButton"
            :title="confirmingId === bookmarklet.id ? deleteConfirmLabel : deleteLabel"
            @click.stop="onDeleteClick(bookmarklet.id)"
          >
            <TrashIcon :class="ui.toolCardIcon" />
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
