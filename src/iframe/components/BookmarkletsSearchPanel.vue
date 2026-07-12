<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { ArrowPathIcon, MagnifyingGlassIcon, SparklesIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import type { StoredBookmarklet, StoredCategory } from '@/shared/bookmarkletsDb'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { llmErrorText } from '@/shared/llmErrorText'
import { useToast } from '../plugins/toast'
import BookmarkletsResultsList from './BookmarkletsResultsList.vue'
import LlmConfigModal from './wizard/LlmConfigModal.vue'

const props = defineProps<{
  bookmarklets: StoredBookmarklet[]
  categories: StoredCategory[]
}>()
const emit = defineEmits<{ select: [id: string] }>()

const channel = inject(channelKey)
const toast = useToast()

const searchPlaceholder = chrome.i18n.getMessage('bookmarkletsSearchPlaceholder')
const searchClearLabel = chrome.i18n.getMessage('bookmarkletsSearchClear')
const noResultsText = chrome.i18n.getMessage('bookmarkletsSearchNoResults')
const aiSearchLabel = chrome.i18n.getMessage('bookmarkletsAiSearch')
const aiResultsHeaderText = computed(() => chrome.i18n.getMessage('bookmarkletsAiSearchResultsHeader', [aiQueryUsed.value]))

const query = ref('')

// AI results stay shown only as long as the query hasn't changed since that search ran —
// editing the text falls straight back to the plain live filter below.
const aiSearching = ref(false)
const aiResultIds = ref<string[] | null>(null)
const aiQueryUsed = ref('')
const showConfigModal = ref(false)
const isAiResultsActive = computed(() => aiResultIds.value !== null && aiQueryUsed.value === query.value)

function categoryName(categoryId: string): string {
  return props.categories.find((category) => category.id === categoryId)?.name ?? ''
}

const liveResults = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (needle === '') return []
  return props.bookmarklets.filter(
    (bookmarklet) =>
      bookmarklet.title.toLowerCase().includes(needle) ||
      bookmarklet.description.toLowerCase().includes(needle) ||
      bookmarklet.url.toLowerCase().includes(needle) ||
      bookmarklet.tags.some((tag) => tag.toLowerCase().includes(needle)),
  )
})

const aiResults = computed(() => {
  const ids = aiResultIds.value ?? []
  const byId = new Map(props.bookmarklets.map((bookmarklet) => [bookmarklet.id, bookmarklet]))
  return ids.map((id) => byId.get(id)).filter((bookmarklet): bookmarklet is StoredBookmarklet => bookmarklet !== undefined)
})

const results = computed(() => (isAiResultsActive.value ? aiResults.value : liveResults.value))

/** Same workflow as the wizard's "Generate with AI": opens the setup popup if unconfigured, retries automatically once saved. */
async function onAiSearch(): Promise<void> {
  if (!channel || aiSearching.value) return
  const text = query.value.trim()
  if (text === '') return

  const configResponse = await channel.send({ type: 'getPreference', key: 'llmConfig' })
  const configured = configResponse.type === 'preferenceValue' && Boolean(configResponse.value)
  if (!configured) {
    showConfigModal.value = true
    return
  }

  aiSearching.value = true
  const response = await channel.send({
    type: 'searchBookmarklets',
    query: text,
    items: props.bookmarklets.map((bookmarklet) => ({
      id: bookmarklet.id,
      title: bookmarklet.title,
      description: bookmarklet.description,
      tags: bookmarklet.tags,
      category: categoryName(bookmarklet.categoryId),
      url: bookmarklet.url,
    })),
  })
  aiSearching.value = false

  if (response.type !== 'searchBookmarkletsResult' || !response.ok) {
    const errorCode = response.type === 'searchBookmarkletsResult' ? response.errorCode : 'unknown'
    const detail = response.type === 'searchBookmarkletsResult' ? response.detail : undefined
    toast.error(llmErrorText(errorCode, detail))
    return
  }

  aiResultIds.value = response.ids ?? []
  aiQueryUsed.value = text
}

function onConfigSaved(): void {
  showConfigModal.value = false
  void onAiSearch()
}
</script>

<template>
  <div>
    <div :class="ui.bookmarkletsSearchRow">
      <div :class="ui.bookmarkletsSearchInputWrapper">
        <MagnifyingGlassIcon :class="ui.bookmarkletsSearchInputIcon" />
        <input v-model="query" type="text" autofocus :class="ui.bookmarkletsSearchInput" :placeholder="searchPlaceholder" />
        <button
          v-if="query !== ''"
          type="button"
          :class="ui.toolsSearchClear"
          :aria-label="searchClearLabel"
          @click="query = ''"
        >
          <XMarkIcon :class="ui.toolsSearchClearIcon" />
        </button>
      </div>

      <button
        type="button"
        :class="ui.secondaryButton"
        :disabled="aiSearching || query.trim() === ''"
        :title="aiSearchLabel"
        @click="onAiSearch"
      >
        <ArrowPathIcon v-if="aiSearching" :class="[ui.toolbarIcon, 'animate-spin']" />
        <SparklesIcon v-else :class="ui.toolbarIcon" />
        {{ aiSearchLabel }}
      </button>
    </div>

    <BookmarkletsResultsList
      v-if="query.trim() !== ''"
      :header-text="isAiResultsActive ? aiResultsHeaderText : undefined"
      :bookmarklets="results"
      :categories="categories"
      :no-results-text="noResultsText"
      @select="(id) => emit('select', id)"
    />

    <LlmConfigModal v-if="showConfigModal" @close="showConfigModal = false" @saved="onConfigSaved" />
  </div>
</template>
