<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronRightIcon, DocumentTextIcon, FolderIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { UNCATEGORIZED_REPLACER_CATEGORY_ID, type StoredReplacer } from '@/shared/replacerDb'
import type { CategoryTreeNode } from '@/shared/categoryTree'

defineOptions({ name: 'ReplacerCategoryNode' })

const props = defineProps<{
  node: CategoryTreeNode
  replacers: StoredReplacer[]
  selectedId: string | null
  depth: number
}>()
const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
  deleteCategory: [id: string]
  // categoryPath: the target node's fullPath ReplacerView resolves it to a category, creating
  // one by that name first if it's still just a structural path segment.
  move: [id: string, categoryPath: string]
}>()

const DRAG_MIME = 'application/x-smootter-replacer-id'

const deleteLabel = chrome.i18n.getMessage('toolDelete')
const deleteConfirmLabel = chrome.i18n.getMessage('bookmarkletsDeleteConfirm')
const categoryDeleteConfirmLabel = chrome.i18n.getMessage('bookmarkletsCategoryDeleteConfirm')

const items = computed(() =>
  props.node.category
    ? props.replacers.filter((replacer) => replacer.categoryId === props.node.category?.id)
    : [],
)
const canExpand = computed(() => props.node.children.length > 0 || items.value.length > 0)
const isUncategorized = computed(() => props.node.category?.id === UNCATEGORIZED_REPLACER_CATEGORY_ID)
// Tailwind utilities can't express an arbitrary, unbounded nesting depth the one spot
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

function onDragStart(id: string, event: DragEvent): void {
  event.dataTransfer?.setData(DRAG_MIME, id)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

// Every node is a valid drop target, including purely structural path segments (e.g. "AA"
// when only "AA/BB" was ever created) dropping there promotes it into a real category on
// the fly (ReplacerView creates it by name if it doesn't exist yet).
// dragenter/dragleave also fire when the pointer crosses the row's own children (the chevron,
// icon, text) since they bubble a plain boolean flickers on/off as it crosses them, so a
// counter nets that out to "is the pointer still somewhere inside this row".
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
        :class="confirmingCategory ? ui.bookmarkletsRowActionButtonDeleteConfirm : ui.bookmarkletsRowActionButton"
        :title="confirmingCategory ? categoryDeleteConfirmLabel : deleteLabel"
        @click.stop="onDeleteCategoryClick"
      >
        <TrashIcon :class="ui.toolCardIcon" />
      </button>
    </div>

    <template v-if="!collapsed">
      <ReplacerCategoryNode
        v-for="child in node.children"
        :key="child.fullPath"
        :node="child"
        :replacers="replacers"
        :selected-id="selectedId"
        :depth="depth + 1"
        @select="(id) => emit('select', id)"
        @delete="(id) => emit('delete', id)"
        @delete-category="(id) => emit('deleteCategory', id)"
        @move="(id, categoryId) => emit('move', id, categoryId)"
      />

      <div v-for="replacer in items" :key="replacer.id" :class="ui.bookmarkletsSidebarRow" :style="indentStyle">
        <button
          type="button"
          draggable="true"
          :class="[ui.bookmarkletsSidebarItem, replacer.id === selectedId && ui.bookmarkletsSidebarItemActive]"
          :title="replacer.title"
          @click="emit('select', replacer.id)"
          @dragstart="onDragStart(replacer.id, $event)"
        >
          <DocumentTextIcon :class="ui.bookmarkletsSidebarItemFaviconFallback" />
          <span :class="ui.bookmarkletsSidebarItemText">{{ replacer.title }}</span>
        </button>
        <button
          type="button"
          :class="confirmingId === replacer.id ? ui.bookmarkletsRowActionButtonDeleteConfirm : ui.bookmarkletsRowActionButton"
          :title="confirmingId === replacer.id ? deleteConfirmLabel : deleteLabel"
          @click.stop="onDeleteClick(replacer.id)"
        >
          <TrashIcon :class="ui.toolCardIcon" />
        </button>
      </div>
    </template>
  </div>
</template>
