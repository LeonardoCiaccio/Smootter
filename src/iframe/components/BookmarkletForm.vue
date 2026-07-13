<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { ArrowPathIcon, GlobeAltIcon, SparklesIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import CategoryCombobox from './CategoryCombobox.vue'
import TagsInput from './TagsInput.vue'
import LlmConfigModal from './wizard/LlmConfigModal.vue'
import {
  ensureFavicon,
  saveBookmarklet,
  saveCategory,
  UNCATEGORIZED_CATEGORY_ID,
  type StoredBookmarklet,
  type StoredCategory,
} from '@/shared/bookmarkletsDb'
import { normalizeCategoryName } from '@/shared/categoryTree'
import { hostnameOf } from '@/shared/url'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { llmErrorText } from '@/shared/llmErrorText'
import { useToast } from '../plugins/toast'

const props = defineProps<{
  currentUrl: string
  initialTitle: string
  categories: StoredCategory[]
  tagSuggestions: string[]
  // Set when currentUrl matches an already-saved bookmarklet — the form edits it in place
  // instead of creating a duplicate, and prefills what was saved before.
  existingBookmarklet: StoredBookmarklet | null
  // The live tab's own resolved favicon URL — only usable to fetch a fresh favicon when
  // editing the current page itself (an arbitrary past bookmarklet has no live tab to ask).
  faviconUrl?: string
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
const generateLabel = chrome.i18n.getMessage('bookmarkletsGenerate')

const channel = inject(channelKey)
const toast = useToast()

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

// initialTitle arrives asynchronously (BookmarkletsView fetches it via a message after mount),
// so it's often still '' the moment resetFrom first runs — pick it up once it resolves, but
// only for a brand-new entry (editing an existing bookmarklet keeps its own saved title).
watch(
  () => props.initialTitle,
  (value) => {
    if (!props.existingBookmarklet) title.value = value
  },
)

// Editing a bookmarklet selected from the sidebar/tag results keeps its own URL, which may
// not be the page currently open — only a brand-new entry uses the live current page's URL.
const linkUrl = computed(() => props.existingBookmarklet?.url ?? props.currentUrl)

const currentDomain = computed(() => hostnameOf(props.currentUrl))

// Favicons are cached per domain (bookmarkletsDb.ensureFavicon), not per bookmarklet — several
// saved pages on the same site share one. Falls back to a generic icon when nothing's cached
// and there's no live tab to fetch a fresh one from (editing a past bookmarklet on another site).
const faviconDataUrl = ref<string | null>(null)

watch(
  linkUrl,
  async (url) => {
    faviconDataUrl.value = null
    const domain = hostnameOf(url)
    if (domain === '') return
    const liveFaviconUrl = domain === currentDomain.value ? props.faviconUrl : undefined
    faviconDataUrl.value = (await ensureFavicon(domain, liveFaviconUrl)) ?? null
  },
  { immediate: true },
)

const canSave = computed(() => title.value.trim() !== '' && categoryId.value !== '')

const generating = ref(false)
const showConfigModal = ref(false)

/** Reuses an existing category by (normalized) name if one matches, otherwise creates it. */
async function resolveCategoryByName(name: string): Promise<void> {
  const normalized = normalizeCategoryName(name)
  if (normalized === '') return

  const existing = props.categories.find((category) => category.name === normalized)
  if (existing) {
    categoryId.value = existing.id
    return
  }

  const category: StoredCategory = { id: crypto.randomUUID(), name: normalized }
  await saveCategory(category)
  emit('categoryCreated', category)
  categoryId.value = category.id
}

/**
 * Same workflow as the wizard's "Generate with AI": if the LLM isn't configured yet, open the
 * setup popup and retry automatically once it's saved. On success, fills description/category/
 * tags — the existing ones (passed as context to the model) are what it's told to prefer reusing.
 */
async function onGenerate(): Promise<void> {
  if (!channel || generating.value) return

  const configResponse = await channel.send({ type: 'getPreference', key: 'llmConfig' })
  const configured = configResponse.type === 'preferenceValue' && Boolean(configResponse.value)
  if (!configured) {
    showConfigModal.value = true
    return
  }

  generating.value = true
  const response = await channel.send({
    type: 'generateBookmarklet',
    url: linkUrl.value,
    currentTitle: title.value,
    existingTags: props.tagSuggestions,
    // The fixed "uncategorized" category is a fallback label, not a real content category —
    // leaving it in this list gives the model an easy out to always "reuse" it instead of
    // proposing something specific.
    existingCategories: props.categories
      .filter((category) => category.id !== UNCATEGORIZED_CATEGORY_ID)
      .map((category) => category.name),
  })
  generating.value = false

  if (response.type !== 'generateBookmarkletResult' || !response.ok) {
    const errorCode = response.type === 'generateBookmarkletResult' ? response.errorCode : 'unknown'
    const detail = response.type === 'generateBookmarkletResult' ? response.detail : undefined
    toast.error(llmErrorText(errorCode, detail))
    return
  }

  if (response.title && title.value.trim() === '') title.value = response.title
  if (response.description) description.value = response.description
  if (response.tags) tags.value = response.tags
  if (response.category) await resolveCategoryByName(response.category)
}

function onConfigSaved(): void {
  showConfigModal.value = false
  void onGenerate()
}

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
    // saveBookmarklet() always recomputes this from the other fields.
    searchTerms: [],
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
        <div :class="ui.bookmarkletsTitleRow">
          <input v-model="title" type="text" :class="ui.input" :placeholder="titlePlaceholder" />
          <span :class="ui.bookmarkletsFavicon">
            <img v-if="faviconDataUrl" :src="faviconDataUrl" :class="ui.bookmarkletsFaviconImage" alt="" />
            <GlobeAltIcon v-else :class="ui.bookmarkletsFaviconFallback" />
          </span>
        </div>
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

      <div :class="ui.bookmarkletsFormActions">
        <button type="button" :class="ui.secondaryButton" :disabled="generating" @click="onGenerate">
          <ArrowPathIcon v-if="generating" :class="[ui.toolbarIcon, 'animate-spin']" />
          <SparklesIcon v-else :class="ui.toolbarIcon" />
          {{ generateLabel }}
        </button>
        <button type="submit" :class="ui.primaryButton" :disabled="!canSave">{{ saveLabel }}</button>
      </div>
    </form>

    <LlmConfigModal v-if="showConfigModal" @close="showConfigModal = false" @saved="onConfigSaved" />
  </div>
</template>
