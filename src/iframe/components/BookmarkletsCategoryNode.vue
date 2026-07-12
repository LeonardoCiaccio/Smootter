<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowTopRightOnSquareIcon, ChevronRightIcon, FolderIcon, GlobeAltIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { UNCATEGORIZED_CATEGORY_ID, type StoredBookmarklet } from '@/shared/bookmarkletsDb'
import type { CategoryTreeNode } from '@/shared/categoryTree'
import { hostnameOf } from '@/shared/url'

defineOptions({ name: 'BookmarkletsCategoryNode' })

const props = defineProps<{
  node: CategoryTreeNode
  bookmarklets: StoredBookmarklet[]
  selectedId: string | null
  depth: number
  // Cached favicon data URLs by domain — read-only here, populated by BookmarkletsSidebar.
  faviconsByDomain: Record<string, string>
}>()
const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
  deleteCategory: [id: string]
  // categoryPath: the target node's fullPath — BookmarkletsView resolves it to a category,
  // creating one by that name first if it's still just a structural path segment.
  move: [id: string, categoryPath: string]
}>()

const DRAG_MIME = 'application/x-smootter-bookmarklet-id'

const deleteLabel = chrome.i18n.getMessage('toolDelete')
const openInNewTabLabel = chrome.i18n.getMessage('bookmarkletsOpenInNewTab')
const deleteConfirmLabel = chrome.i18n.getMessage('bookmarkletsDeleteConfirm')
const categoryDeleteConfirmLabel = chrome.i18n.getMessage('bookmarkletsCategoryDeleteConfirm')

const items = computed(() =>
  props.node.category
    ? props.bookmarklets.filter((bookmarklet) => bookmarklet.categoryId === props.node.category?.id)
    : [],
)
const canExpand = computed(() => props.node.children.length > 0 || items.value.length > 0)
const isUncategorized = computed(() => props.node.category?.id === UNCATEGORIZED_CATEGORY_ID)
// Tailwind utilities can't express an arbitrary, unbounded nesting depth — the one spot
// where an inline style is the only option, per project convention for that exact case.
const indentStyle = computed(() => ({ paddingLeft: `${props.depth * 14}px` }))

const collapsed = ref(false)

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

function faviconFor(url: string): string | undefined {
  return props.faviconsByDomain[hostnameOf(url)]
}

function onDragStart(id: string, event: DragEvent): void {
  event.dataTransfer?.setData(DRAG_MIME, id)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

// Every node is a valid drop target, including purely structural path segments (e.g. "AA"
// when only "AA/BB" was ever created) — dropping there promotes it into a real category on
// the fly (BookmarkletsView creates it by name if it doesn't exist yet).
// dragenter/dragleave also fire when the pointer crosses the row's own children (the chevron,
// icon, text) since they bubble — a plain boolean flickers on/off as it crosses them, so a
// counter nets that out to "is the pointer still somewhere inside this row" (same pattern as
// HomeView's file-drop overlay).
const dropDepth = ref(0)
const isDropTarget = computed(() => dropDepth.value > 0)

function onDragOver(event: DragEvent): void {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}

function onDragEnter(): void {
  dropDepth.value++
}

function onDragLeave(): void {
  dropDepth.value = Math.max(0, dropDepth.value - 1)
}

function onDrop(event: DragEvent): void {
  dropDepth.value = 0
  const id = event.dataTransfer?.getData(DRAG_MIME)
  if (id) emit('move', id, props.node.fullPath)
}

const confirmingCategory = ref(false)
let categoryDisarmTimer: ReturnType<typeof setTimeout> | undefined

function onDeleteCategoryClick(): void {
  if (!props.node.category) return
  clearTimeout(categoryDisarmTimer)
  if (!confirmingCategory.value) {
    confirmingCategory.value = true
    categoryDisarmTimer = setTimeout(() => (confirmingCategory.value = false), 3000)
    return
  }
  confirmingCategory.value = false
  emit('deleteCategory', props.node.category.id)
}
</script>

<template>
  <div :class="ui.bookmarkletsCategoryGroup">
    <div
      :class="ui.bookmarkletsSidebarRow"
      :style="indentStyle"
      @dragover="onDragOver"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <button
        type="button"
        :class="[ui.bookmarkletsCategoryHeader, isDropTarget && ui.bookmarkletsCategoryHeaderDropTarget]"
        @click="collapsed = !collapsed"
      >
        <ChevronRightIcon
          v-if="canExpand"
          :class="[ui.bookmarkletsCategoryChevron, !collapsed && ui.bookmarkletsCategoryChevronOpen]"
        />
        <FolderIcon :class="ui.bookmarkletsCategoryIcon" />
        <span :class="ui.bookmarkletsCategoryName">{{ node.segment }}</span>
      </button>
      <button
        v-if="node.category && !isUncategorized"
        type="button"
        :class="[confirmingCategory ? ui.toolCardDeleteConfirm : ui.toolCardActionButton, ui.bookmarkletsRowDelete]"
        :title="confirmingCategory ? categoryDeleteConfirmLabel : deleteLabel"
        @click.stop="onDeleteCategoryClick"
      >
        <TrashIcon :class="ui.toolCardIcon" />
      </button>
    </div>

    <template v-if="!collapsed">
      <BookmarkletsCategoryNode
        v-for="child in node.children"
        :key="child.fullPath"
        :node="child"
        :bookmarklets="bookmarklets"
        :selected-id="selectedId"
        :depth="depth + 1"
        :favicons-by-domain="faviconsByDomain"
        @select="(id) => emit('select', id)"
        @delete="(id) => emit('delete', id)"
        @delete-category="(id) => emit('deleteCategory', id)"
        @move="(id, categoryId) => emit('move', id, categoryId)"
      />

      <div
        v-for="bookmarklet in items"
        :key="bookmarklet.id"
        :class="ui.bookmarkletsSidebarRow"
        :style="indentStyle"
      >
        <button
          type="button"
          draggable="true"
          :class="[ui.bookmarkletsSidebarItem, bookmarklet.id === selectedId && ui.bookmarkletsSidebarItemActive]"
          :title="bookmarklet.title"
          @click="emit('select', bookmarklet.id)"
          @dragstart="onDragStart(bookmarklet.id, $event)"
        >
          <img
            v-if="faviconFor(bookmarklet.url)"
            :src="faviconFor(bookmarklet.url)"
            :class="ui.bookmarkletsSidebarItemFavicon"
            alt=""
          />
          <GlobeAltIcon v-else :class="ui.bookmarkletsSidebarItemFaviconFallback" />
          <span :class="ui.bookmarkletsSidebarItemText">{{ bookmarklet.title }}</span>
        </button>
        <a
          :href="bookmarklet.url"
          target="_blank"
          rel="noopener noreferrer"
          :class="[ui.toolCardActionButton, ui.bookmarkletsRowDelete]"
          :title="openInNewTabLabel"
          @click.stop
        >
          <ArrowTopRightOnSquareIcon :class="ui.toolCardIcon" />
        </a>
        <button
          type="button"
          :class="[confirmingId === bookmarklet.id ? ui.toolCardDeleteConfirm : ui.toolCardActionButton, ui.bookmarkletsRowDelete]"
          :title="confirmingId === bookmarklet.id ? deleteConfirmLabel : deleteLabel"
          @click.stop="onDeleteClick(bookmarklet.id)"
        >
          <TrashIcon :class="ui.toolCardIcon" />
        </button>
      </div>
    </template>
  </div>
</template>
