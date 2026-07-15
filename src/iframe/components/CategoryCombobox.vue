<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { ui } from '@/styles/ui'
import type { CategoryLike } from '@/shared/categoryTree'

/**
 * Free-text category path, not a select the user can type "Casa/Giardino" directly instead of
 * picking-then-creating in two steps. Never touches the database itself: the caller resolves
 * this path to an existing-or-new category only once, at its own save time (see
 * BookmarkletForm.vue/ReplacerForm.vue's resolveCategoryPath), so a category that's only
 * half-typed or abandoned mid-edit never gets persisted.
 */
const props = defineProps<{
  categories: CategoryLike[]
  label: string
  placeholder: string
}>()
const categoryPath = defineModel<string>('categoryPath', { required: true })

const open = ref(false)
const anchorRef = ref<HTMLElement>()

const filteredSuggestions = computed(() => {
  const query = categoryPath.value.trim().toLowerCase()
  return props.categories
    .map((category) => category.name)
    .filter((name) => query === '' || name.toLowerCase().includes(query))
})

function onDocumentClick(event: MouseEvent): void {
  if (!anchorRef.value?.contains(event.target as Node)) open.value = false
}

function onFocus(): void {
  open.value = true
  document.addEventListener('mousedown', onDocumentClick)
}

function onSuggestionClick(name: string): void {
  categoryPath.value = name
  open.value = false
}

onUnmounted(() => document.removeEventListener('mousedown', onDocumentClick))
</script>

<template>
  <label :class="ui.wizardField">
    <span :class="ui.wizardFieldLabel">{{ label }}</span>
    <div ref="anchorRef" :class="ui.categoryComboboxAnchor">
      <input
        v-model="categoryPath"
        type="text"
        :class="ui.input"
        :placeholder="placeholder"
        @focus="onFocus"
        @keydown.escape="open = false"
      />
      <div v-if="open && filteredSuggestions.length > 0" :class="ui.categoryComboboxMenu">
        <button
          v-for="name in filteredSuggestions"
          :key="name"
          type="button"
          :class="ui.categoryComboboxOption"
          @click="onSuggestionClick(name)"
        >
          {{ name }}
        </button>
      </div>
    </div>
  </label>
</template>
