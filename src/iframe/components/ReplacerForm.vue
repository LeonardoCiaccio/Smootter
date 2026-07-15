<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ui } from '@/styles/ui'
import CategoryCombobox from './CategoryCombobox.vue'
import TagsInput from './TagsInput.vue'
import {
  saveReplacer,
  saveReplacerCategory,
  type StoredReplacer,
  type StoredReplacerCategory,
} from '@/shared/replacerDb'
import type { CategoryLike } from '@/shared/categoryTree'

const props = defineProps<{
  categories: StoredReplacerCategory[]
  tagSuggestions: string[]
  // Set when editing a saved replacer selected from the sidebar/tag results; null for a new one.
  existingReplacer: StoredReplacer | null
}>()
const emit = defineEmits<{
  saved: [replacer: StoredReplacer]
  categoryCreated: [category: StoredReplacerCategory]
}>()

const headerText = computed(() =>
  chrome.i18n.getMessage(props.existingReplacer ? 'replacerEditHeader' : 'replacerHeader'),
)
const subheaderText = chrome.i18n.getMessage('replacerSubheader')
const titleLabel = chrome.i18n.getMessage('replacerFormTitleLabel')
const titlePlaceholder = chrome.i18n.getMessage('replacerFormTitlePlaceholder')
const placeholderLabel = chrome.i18n.getMessage('replacerFormPlaceholderLabel')
const placeholderPlaceholder = chrome.i18n.getMessage('replacerFormPlaceholderPlaceholder')
const tagsLabel = chrome.i18n.getMessage('bookmarkletsFormTagsLabel')
const textLabel = chrome.i18n.getMessage('replacerFormTextLabel')
const textPlaceholder = chrome.i18n.getMessage('replacerFormTextPlaceholder')
const saveLabel = chrome.i18n.getMessage('bookmarkletsSave')
const categoryLabel = chrome.i18n.getMessage('bookmarkletsFormCategoryLabel')
const newCategoryTitle = chrome.i18n.getMessage('bookmarkletsCategoryNewOption')
const newCategoryPlaceholder = chrome.i18n.getMessage('bookmarkletsCategoryNewPlaceholder')

function resetFrom(existing: StoredReplacer | null): void {
  title.value = existing?.title ?? ''
  placeholder.value = existing?.placeholder ?? ''
  text.value = existing?.text ?? ''
  tags.value = existing ? [...existing.tags] : []
  categoryId.value = existing?.categoryId ?? props.categories[0]?.id ?? ''
}

const title = ref('')
const placeholder = ref('')
const text = ref('')
const tags = ref<string[]>([])
const categoryId = ref('')
resetFrom(props.existingReplacer)

watch(() => props.existingReplacer, resetFrom)

const canSave = computed(
  () => title.value.trim() !== '' && placeholder.value.trim() !== '' && categoryId.value !== '',
)

async function onSubmit(): Promise<void> {
  if (!canSave.value) return

  const now = Date.now()
  const replacer: StoredReplacer = {
    id: props.existingReplacer?.id ?? crypto.randomUUID(),
    title: title.value.trim(),
    placeholder: placeholder.value.trim(),
    text: text.value,
    tags: tags.value,
    categoryId: categoryId.value,
    createdAt: props.existingReplacer?.createdAt ?? now,
    updatedAt: now,
    // saveReplacer() always recomputes this from the other fields.
    searchTerms: [],
  }
  await saveReplacer(replacer)
  emit('saved', replacer)
}
</script>

<template>
  <div :class="ui.replacerForm">
    <div :class="ui.bookmarkletsHeaderGroup">
      <h1 :class="ui.bookmarkletsHeader">{{ headerText }}</h1>
      <p :class="ui.bookmarkletsSubheader">{{ subheaderText }}</p>
    </div>

    <form :class="ui.replacerForm" @submit.prevent="onSubmit">
      <label :class="ui.wizardField">
        <span :class="ui.wizardFieldLabel">{{ titleLabel }}</span>
        <input v-model="title" type="text" :class="ui.input" :placeholder="titlePlaceholder" />
      </label>

      <label :class="ui.wizardField">
        <span :class="ui.wizardFieldLabel">{{ placeholderLabel }}</span>
        <input v-model="placeholder" type="text" :class="ui.input" :placeholder="placeholderPlaceholder" />
      </label>

      <label :class="ui.wizardField">
        <span :class="ui.wizardFieldLabel">{{ tagsLabel }}</span>
        <TagsInput v-model:tags="tags" :suggestions="props.tagSuggestions" />
      </label>

      <CategoryCombobox
        v-model:category-id="categoryId"
        :categories="props.categories"
        :save-category="saveReplacerCategory as (category: CategoryLike) => Promise<void>"
        :category-label="categoryLabel"
        :new-category-title="newCategoryTitle"
        :new-category-placeholder="newCategoryPlaceholder"
        @created="(category) => emit('categoryCreated', category as StoredReplacerCategory)"
      />

      <label :class="ui.replacerTextareaField">
        <span :class="ui.wizardFieldLabel">{{ textLabel }}</span>
        <textarea v-model="text" :class="ui.replacerTextarea" :placeholder="textPlaceholder" />
      </label>

      <div :class="ui.bookmarkletsFormActions">
        <button type="submit" :class="ui.primaryButton" :disabled="!canSave">{{ saveLabel }}</button>
      </div>
    </form>
  </div>
</template>
