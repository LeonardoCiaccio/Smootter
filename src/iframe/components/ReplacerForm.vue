<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ui } from '@/styles/ui'
import CategoryCombobox from './CategoryCombobox.vue'
import TagsInput from './TagsInput.vue'
import {
  saveReplacer,
  saveReplacerCategory,
  UNCATEGORIZED_REPLACER_CATEGORY_ID,
  type StoredReplacer,
  type StoredReplacerCategory,
} from '@/shared/replacerDb'
import { normalizeCategoryName } from '@/shared/categoryTree'

const props = defineProps<{
  categories: StoredReplacerCategory[]
  // Every saved replacer, used only to check the placeholder isn't already taken by a
  // *different* entry unlike bookmarklets (where the url doubles as the identity key and
  // reusing one just edits that entry in place), two replacers sharing the same trigger word
  // would silently shadow each other at expand time, so it's flagged instead of allowed.
  replacers: StoredReplacer[]
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
const categoryPathPlaceholder = chrome.i18n.getMessage('bookmarkletsCategoryNewPlaceholder')

function resetFrom(existing: StoredReplacer | null): void {
  title.value = existing?.title ?? ''
  placeholder.value = existing?.placeholder ?? ''
  text.value = existing?.text ?? ''
  tags.value = existing ? [...existing.tags] : []
  const existingCategory = existing
    ? props.categories.find((category) => category.id === existing.categoryId)
    : undefined
  categoryPath.value = existingCategory?.name ?? props.categories[0]?.name ?? ''
}

const title = ref('')
const placeholder = ref('')
const text = ref('')
const tags = ref<string[]>([])
const categoryPath = ref('')
resetFrom(props.existingReplacer)

watch(() => props.existingReplacer, resetFrom)

const placeholderTaken = computed(() => {
  const trimmed = placeholder.value.trim()
  if (trimmed === '') return false
  return props.replacers.some(
    (existing) => existing.placeholder === trimmed && existing.id !== props.existingReplacer?.id,
  )
})
const placeholderTakenText = chrome.i18n.getMessage('replacerPlaceholderTaken')

const canSave = computed(
  () =>
    title.value.trim() !== '' &&
    placeholder.value.trim() !== '' &&
    categoryPath.value.trim() !== '' &&
    !placeholderTaken.value,
)

/**
 * Reuses an existing category by (normalized) name if one matches, otherwise creates it. Only
 * called once, from onSubmit: the free-text field the user's been typing into never touches
 * the database on its own, so an abandoned or half-typed category path never gets persisted.
 */
async function resolveCategoryId(path: string): Promise<string> {
  const normalized = normalizeCategoryName(path)
  if (normalized === '') return UNCATEGORIZED_REPLACER_CATEGORY_ID

  const existing = props.categories.find((category) => category.name === normalized)
  if (existing) return existing.id

  const category: StoredReplacerCategory = { id: crypto.randomUUID(), name: normalized }
  await saveReplacerCategory(category)
  emit('categoryCreated', category)
  return category.id
}

async function onSubmit(): Promise<void> {
  if (!canSave.value) return

  const categoryId = await resolveCategoryId(categoryPath.value)
  const now = Date.now()
  const replacer: StoredReplacer = {
    id: props.existingReplacer?.id ?? crypto.randomUUID(),
    title: title.value.trim(),
    placeholder: placeholder.value.trim(),
    text: text.value,
    tags: tags.value,
    categoryId,
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
        <input
          v-model="placeholder"
          type="text"
          :class="placeholderTaken ? ui.inputInvalid : ui.input"
          :placeholder="placeholderPlaceholder"
        />
        <p v-if="placeholderTaken" :class="ui.inputErrorText">{{ placeholderTakenText }}</p>
      </label>

      <label :class="ui.wizardField">
        <span :class="ui.wizardFieldLabel">{{ tagsLabel }}</span>
        <TagsInput v-model:tags="tags" :suggestions="props.tagSuggestions" />
      </label>

      <CategoryCombobox
        v-model:category-path="categoryPath"
        :categories="props.categories"
        :label="categoryLabel"
        :placeholder="categoryPathPlaceholder"
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
