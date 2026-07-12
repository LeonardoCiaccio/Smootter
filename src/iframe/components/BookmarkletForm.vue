<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ui } from '@/styles/ui'
import CategoryCombobox from './CategoryCombobox.vue'
import TagsInput from './TagsInput.vue'
import { saveBookmarklet, type StoredBookmarklet, type StoredCategory } from '@/shared/bookmarkletsDb'

const props = defineProps<{
  currentUrl: string
  initialTitle: string
  categories: StoredCategory[]
  tagSuggestions: string[]
  // Set when currentUrl matches an already-saved bookmarklet — the form edits it in place
  // instead of creating a duplicate, and prefills what was saved before.
  existingBookmarklet: StoredBookmarklet | null
}>()
const emit = defineEmits<{
  saved: [bookmarklet: StoredBookmarklet]
  categoryCreated: [category: StoredCategory]
}>()

const headerText = computed(() =>
  chrome.i18n.getMessage(props.existingBookmarklet ? 'bookmarkletsEditHeader' : 'bookmarkletsHeader'),
)
const subheaderText = chrome.i18n.getMessage('bookmarkletsSubheader')
const titleLabel = chrome.i18n.getMessage('bookmarkletsFormTitleLabel')
const titlePlaceholder = chrome.i18n.getMessage('bookmarkletsFormTitlePlaceholder')
const linkLabel = chrome.i18n.getMessage('bookmarkletsFormLinkLabel')
const descriptionLabel = chrome.i18n.getMessage('bookmarkletsFormDescriptionLabel')
const descriptionPlaceholder = chrome.i18n.getMessage('bookmarkletsFormDescriptionPlaceholder')
const tagsLabel = chrome.i18n.getMessage('bookmarkletsFormTagsLabel')
const saveLabel = chrome.i18n.getMessage('bookmarkletsSave')

function resetFrom(existing: StoredBookmarklet | null): void {
  title.value = existing?.title ?? props.initialTitle
  description.value = existing?.description ?? ''
  tags.value = existing ? [...existing.tags] : []
  categoryId.value = existing?.categoryId ?? props.categories[0]?.id ?? ''
}

const title = ref('')
const description = ref('')
const tags = ref<string[]>([])
const categoryId = ref('')
resetFrom(props.existingBookmarklet)

// The URL can change (navigating the sidebar's "add" action re-checks the current page) —
// re-sync the form each time so it keeps reflecting the right existing-or-blank state.
watch(() => props.existingBookmarklet, resetFrom)

// Editing a bookmarklet selected from the sidebar/tag results keeps its own URL, which may
// not be the page currently open — only a brand-new entry uses the live current page's URL.
const linkUrl = computed(() => props.existingBookmarklet?.url ?? props.currentUrl)

const canSave = computed(() => title.value.trim() !== '' && categoryId.value !== '')

const alreadySavedNotice = computed(() => {
  if (!props.existingBookmarklet) return ''
  const date = new Date(props.existingBookmarklet.updatedAt).toLocaleDateString()
  return chrome.i18n.getMessage('bookmarkletsAlreadySaved', [date])
})

async function onSubmit(): Promise<void> {
  if (!canSave.value) return

  const now = Date.now()
  const bookmarklet: StoredBookmarklet = {
    id: props.existingBookmarklet?.id ?? crypto.randomUUID(),
    title: title.value.trim(),
    url: linkUrl.value,
    description: description.value.trim(),
    tags: tags.value,
    categoryId: categoryId.value,
    createdAt: props.existingBookmarklet?.createdAt ?? now,
    updatedAt: now,
  }
  await saveBookmarklet(bookmarklet)
  emit('saved', bookmarklet)
}
</script>

<template>
  <div>
    <div :class="ui.bookmarkletsHeaderGroup">
      <h1 :class="ui.bookmarkletsHeader">{{ headerText }}</h1>
      <p :class="ui.bookmarkletsSubheader">{{ subheaderText }}</p>
    </div>

    <p v-if="alreadySavedNotice" :class="ui.bookmarkletsAlreadySavedNotice">{{ alreadySavedNotice }}</p>

    <form :class="ui.bookmarkletsForm" @submit.prevent="onSubmit">
      <label :class="ui.wizardField">
        <span :class="ui.wizardFieldLabel">{{ titleLabel }}</span>
        <input v-model="title" type="text" :class="ui.input" :placeholder="titlePlaceholder" />
      </label>

      <label :class="ui.wizardField">
        <span :class="ui.wizardFieldLabel">{{ linkLabel }}</span>
        <input :value="linkUrl" type="text" readonly :class="ui.inputReadonly" />
      </label>

      <label :class="ui.wizardField">
        <span :class="ui.wizardFieldLabel">{{ descriptionLabel }}</span>
        <textarea v-model="description" rows="3" :class="ui.input" :placeholder="descriptionPlaceholder" />
      </label>

      <label :class="ui.wizardField">
        <span :class="ui.wizardFieldLabel">{{ tagsLabel }}</span>
        <TagsInput v-model:tags="tags" :suggestions="props.tagSuggestions" />
      </label>

      <CategoryCombobox
        v-model:category-id="categoryId"
        :categories="props.categories"
        @created="(category) => emit('categoryCreated', category)"
      />

      <button type="submit" :class="ui.primaryButton" :disabled="!canSave">{{ saveLabel }}</button>
    </form>
  </div>
</template>
