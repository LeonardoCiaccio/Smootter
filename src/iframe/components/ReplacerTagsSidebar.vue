<script setup lang="ts">
import { ref } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'

const props = defineProps<{ tags: string[]; selectedTag: string | null }>()
const emit = defineEmits<{ delete: [tag: string]; select: [tag: string] }>()

const sidebarTitle = chrome.i18n.getMessage('bookmarkletsTagsTitle')
const deleteLabel = chrome.i18n.getMessage('toolDelete')
const deleteConfirmLabel = chrome.i18n.getMessage('bookmarkletsTagDeleteConfirm')

// Delete needs two clicks: the first arms it (auto-disarms after a few seconds), the second deletes.
const confirmingTag = ref<string | null>(null)
let disarmTimer: ReturnType<typeof setTimeout> | undefined

function onDeleteClick(tag: string): void {
  clearTimeout(disarmTimer)
  if (confirmingTag.value !== tag) {
    confirmingTag.value = tag
    disarmTimer = setTimeout(() => (confirmingTag.value = null), 3000)
    return
  }
  confirmingTag.value = null
  emit('delete', tag)
}
</script>

<template>
  <div :class="ui.bookmarkletsTagsSidebar">
    <span :class="ui.bookmarkletsSidebarTitle">{{ sidebarTitle }}</span>
    <div :class="ui.bookmarkletsTagsList">
      <span
        v-for="tag in props.tags"
        :key="tag"
        :class="[ui.bookmarkletsTagPill, tag === props.selectedTag && ui.bookmarkletsTagPillActive]"
      >
        <button type="button" :class="ui.bookmarkletsTagPillLabel" :title="tag" @click="emit('select', tag)">
          {{ tag }}
        </button>
        <button
          type="button"
          :class="confirmingTag === tag ? ui.bookmarkletsTagPillDeleteConfirm : ui.bookmarkletsTagPillDelete"
          :title="confirmingTag === tag ? deleteConfirmLabel : deleteLabel"
          @click="onDeleteClick(tag)"
        >
          <XMarkIcon class="h-3 w-3" />
        </button>
      </span>
    </div>
  </div>
</template>
