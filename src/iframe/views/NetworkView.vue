<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import { MagnifyingGlassIcon, SignalIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import Breadcrumb from '../components/Breadcrumb.vue'
import NetworkCategorySidebar from '../components/NetworkCategorySidebar.vue'
import NetworkEntryRow from '../components/NetworkEntryRow.vue'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { fileExtensionOf } from '@/shared/url'
import type { NetworkEntry } from '@/shared/messages'
import { DEFAULT_NETWORK_CONFIG, type MimeCategoryRule } from '@/shared/preferences'

const channel = inject(channelKey)

const tabId = ref<number | null>(null)
const entries = ref<NetworkEntry[]>([])
const mimeCategories = ref<MimeCategoryRule[]>(DEFAULT_NETWORK_CONFIG.mimeCategories)
const selectedCategory = ref<string>('all')
const query = ref('')

const emptyText = chrome.i18n.getMessage('networkEmpty')
const searchPlaceholder = chrome.i18n.getMessage('networkSearchPlaceholder')
const searchClearLabel = chrome.i18n.getMessage('networkSearchClear')

// Omni-search: matches the url, its file extension, the content-type, method and status —
// whatever the user might remember about a request.
function matchesQuery(entry: NetworkEntry, needle: string): boolean {
  const haystack = `${entry.url} ${fileExtensionOf(entry.url)} ${entry.contentType} ${entry.method} ${entry.status}`.toLowerCase()
  return haystack.includes(needle)
}

const visibleEntries = computed(() => {
  const byCategory =
    selectedCategory.value === 'all' ? entries.value : entries.value.filter((entry) => entry.category === selectedCategory.value)
  const needle = query.value.trim().toLowerCase()
  return needle === '' ? byCategory : byCategory.filter((entry) => matchesQuery(entry, needle))
})

let unsubscribe: (() => void) | undefined

onMounted(async () => {
  const [logResponse, configResponse] = await Promise.all([
    channel?.send({ type: 'getNetworkLog' }),
    channel?.send({ type: 'getPreference', key: 'networkConfig' }),
  ])

  if (logResponse?.type === 'networkLogResult') {
    tabId.value = logResponse.tabId
    entries.value = logResponse.entries
  }
  if (configResponse?.type === 'preferenceValue' && configResponse.key === 'networkConfig' && configResponse.value) {
    mimeCategories.value = configResponse.value.mimeCategories
  }

  unsubscribe = channel?.subscribe((message) => {
    if (message.type !== 'networkEntryCaptured' || message.tabId !== tabId.value) return
    entries.value = [...entries.value, message.entry]
  })
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<template>
  <div :class="ui.viewShell">
    <Breadcrumb view-key="network" />

    <div :class="ui.networkLayout">
      <NetworkCategorySidebar
        :entries="entries"
        :categories="mimeCategories"
        :selected="selectedCategory"
        @select="selectedCategory = $event"
      />

      <div :class="ui.networkMain">
        <div :class="ui.networkSearchRow">
          <div :class="ui.networkSearchInputWrapper">
            <MagnifyingGlassIcon :class="ui.networkSearchInputIcon" />
            <input v-model="query" type="text" :class="ui.networkSearchInput" :placeholder="searchPlaceholder" />
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
        </div>

        <div v-if="visibleEntries.length === 0" :class="ui.networkEmpty">
          <SignalIcon :class="ui.networkEmptyIcon" />
          <p>{{ emptyText }}</p>
        </div>
        <div v-else :class="ui.networkList">
          <NetworkEntryRow v-for="entry in visibleEntries" :key="entry.id" :entry="entry" />
        </div>
      </div>
    </div>
  </div>
</template>
