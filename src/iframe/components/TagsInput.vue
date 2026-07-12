<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'

const props = defineProps<{ suggestions: string[] }>()
const tags = defineModel<string[]>('tags', { required: true })

const draft = ref('')
const open = ref(false)
const anchorRef = ref<HTMLElement>()
const tagsPlaceholder = chrome.i18n.getMessage('bookmarkletsFormTagsPlaceholder')

const filteredSuggestions = computed(() => {
  const query = draft.value.trim().toLowerCase()
  return props.suggestions.filter(
    (suggestion) => !tags.value.includes(suggestion) && (query === '' || suggestion.toLowerCase().includes(query)),
  )
})

function addTag(rawValue: string): void {
  const value = rawValue.trim()
  if (value === '' || tags.value.includes(value)) return
  tags.value = [...tags.value, value]
  draft.value = ''
}

function onDocumentClick(event: MouseEvent): void {
  if (!anchorRef.value?.contains(event.target as Node)) open.value = false
}

function onFocus(): void {
  open.value = true
  document.addEventListener('mousedown', onDocumentClick)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addTag(draft.value)
    return
  }
  if (event.key === 'Backspace' && draft.value === '' && tags.value.length > 0) {
    tags.value = tags.value.slice(0, -1)
    return
  }
  if (event.key === 'Escape') open.value = false
}

function onSuggestionClick(suggestion: string): void {
  addTag(suggestion)
  open.value = false
}

onUnmounted(() => document.removeEventListener('mousedown', onDocumentClick))

function removeTag(tag: string): void {
  tags.value = tags.value.filter((existing) => existing !== tag)
}
</script>

<template>
  <div ref="anchorRef" :class="ui.tagsInputAnchor">
    <div :class="ui.tagsInputWrapper">
      <span v-for="tag in tags" :key="tag" :class="ui.tagChip">
        {{ tag }}
        <button type="button" :class="ui.tagChipRemove" @click="removeTag(tag)">
          <XMarkIcon class="h-3 w-3" />
        </button>
      </span>
      <input
        v-model="draft"
        type="text"
        :class="ui.tagsInput"
        :placeholder="tags.length === 0 ? tagsPlaceholder : ''"
        @focus="onFocus"
        @keydown="onKeydown"
      />
    </div>

    <div v-if="open && filteredSuggestions.length > 0" :class="ui.categoryComboboxMenu">
      <button
        v-for="suggestion in filteredSuggestions"
        :key="suggestion"
        type="button"
        :class="ui.categoryComboboxOption"
        @click="onSuggestionClick(suggestion)"
      >
        {{ suggestion }}
      </button>
    </div>
  </div>
</template>
