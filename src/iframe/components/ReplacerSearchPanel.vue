<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { ArrowPathIcon, MagnifyingGlassIcon, SparklesIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import type { StoredReplacer, StoredReplacerCategory } from '@/shared/replacerDb'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { llmErrorText } from '@/shared/llmErrorText'
import { useToast } from '../plugins/toast'
import ReplacerResultsList from './ReplacerResultsList.vue'
import LlmConfigModal from './wizard/LlmConfigModal.vue'

// Lifted out of the component (not local refs): the parent view swaps this panel out for the
// replacer form whenever a search result is selected, unmounting it. A plain local ref would
// lose the query and AI results the moment that happens forcing a whole new search just to come
// back to where you were. Living in the parent's v-model survives that unmount.
export interface ReplacerSearchState {
  query: string
  aiResultIds: string[] | null
  aiQueryUsed: string
}

const props = defineProps<{
  replacers: StoredReplacer[]
  categories: StoredReplacerCategory[]
}>()
const emit = defineEmits<{ select: [id: string] }>()
const state = defineModel<ReplacerSearchState>('state', { required: true })

const channel = inject(channelKey)
const toast = useToast()

const searchPlaceholder = chrome.i18n.getMessage('replacerSearchPlaceholder')
const searchClearLabel = chrome.i18n.getMessage('bookmarkletsSearchClear')
const noResultsText = chrome.i18n.getMessage('replacerSearchNoResults')
const aiSearchLabel = chrome.i18n.getMessage('bookmarkletsAiSearch')
const aiResultsHeaderText = computed(() => chrome.i18n.getMessage('bookmarkletsAiSearchResultsHeader', [state.value.aiQueryUsed]))

// AI results stay shown only as long as the query hasn't changed since that search ran
// editing the text falls straight back to the plain live filter below.
const aiSearching = ref(false)
const showConfigModal = ref(false)
const isAiResultsActive = computed(
  () => state.value.aiResultIds !== null && state.value.aiQueryUsed === state.value.query,
)

const liveResults = computed(() => {
  const needle = state.value.query.trim().toLowerCase()
  if (needle === '') return []
  return props.replacers.filter(
    (replacer) =>
      replacer.title.toLowerCase().includes(needle) ||
      replacer.placeholder.toLowerCase().includes(needle) ||
      replacer.text.toLowerCase().includes(needle) ||
      replacer.tags.some((tag) => tag.toLowerCase().includes(needle)),
  )
})

const aiResults = computed(() => {
  const ids = state.value.aiResultIds ?? []
  const byId = new Map(props.replacers.map((replacer) => [replacer.id, replacer]))
  return ids.map((id) => byId.get(id)).filter((replacer): replacer is StoredReplacer => replacer !== undefined)
})

const results = computed(() => (isAiResultsActive.value ? aiResults.value : liveResults.value))

/** Same workflow as the wizard's "Generate with AI": opens the setup popup if unconfigured, retries automatically once saved. */
async function onAiSearch(): Promise<void> {
  if (!channel || aiSearching.value) return
  const text = state.value.query.trim()
  if (text === '') return

  const configResponse = await channel.send({ type: 'getPreference', key: 'llmConfig' })
  const configured = configResponse.type === 'preferenceValue' && Boolean(configResponse.value)
  if (!configured) {
    showConfigModal.value = true
    return
  }

  aiSearching.value = true
  const response = await channel.send({ type: 'searchReplacers', query: text })
  aiSearching.value = false

  if (response.type !== 'searchReplacersResult' || !response.ok) {
    const errorCode = response.type === 'searchReplacersResult' ? response.errorCode : 'unknown'
    const detail = response.type === 'searchReplacersResult' ? response.detail : undefined
    toast.error(llmErrorText(errorCode, detail))
    return
  }

  state.value.aiResultIds = response.ids ?? []
  state.value.aiQueryUsed = text
}

function onConfigSaved(): void {
  showConfigModal.value = false
  void onAiSearch()
}

// The HTML `autofocus` attribute is blocked by browsers in a cross-origin subframe (which is
// what this iframe always is, injected into an arbitrary host page) focusing manually after
// mount isn't subject to that restriction.
const searchInput = ref<HTMLInputElement>()
onMounted(() => searchInput.value?.focus())
</script>

<template>
  <div>
    <div :class="ui.bookmarkletsSearchRow">
      <div :class="ui.bookmarkletsSearchInputWrapper">
        <MagnifyingGlassIcon :class="ui.bookmarkletsSearchInputIcon" />
        <input
          ref="searchInput"
          v-model="state.query"
          type="text"
          :class="ui.bookmarkletsSearchInput"
          :placeholder="searchPlaceholder"
        />
        <button
          v-if="state.query !== ''"
          type="button"
          :class="ui.toolsSearchClear"
          :aria-label="searchClearLabel"
          @click="state.query = ''"
        >
          <XMarkIcon :class="ui.toolsSearchClearIcon" />
        </button>
      </div>

      <button
        type="button"
        :class="ui.secondaryButton"
        :disabled="aiSearching || state.query.trim() === ''"
        :title="aiSearchLabel"
        @click="onAiSearch"
      >
        <ArrowPathIcon v-if="aiSearching" :class="[ui.toolbarIcon, 'animate-spin']" />
        <SparklesIcon v-else :class="ui.toolbarIcon" />
        {{ aiSearchLabel }}
      </button>
    </div>

    <ReplacerResultsList
      v-if="state.query.trim() !== ''"
      :header-text="isAiResultsActive ? aiResultsHeaderText : undefined"
      :replacers="results"
      :categories="categories"
      :no-results-text="noResultsText"
      @select="(id) => emit('select', id)"
    />

    <LlmConfigModal v-if="showConfigModal" @close="showConfigModal = false" @saved="onConfigSaved" />
  </div>
</template>
