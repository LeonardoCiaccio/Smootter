<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import { ArrowPathIcon, MagnifyingGlassIcon, SignalIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import Breadcrumb from '../components/Breadcrumb.vue'
import NetworkCategorySidebar from '../components/NetworkCategorySidebar.vue'
import NetworkEntryRow from '../components/NetworkEntryRow.vue'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { fileExtensionOf } from '@/shared/url'
import type { NetworkEntry } from '@/shared/messages'

const channel = inject(channelKey)

const tabId = ref<number | null>(null)
const entries = ref<NetworkEntry[]>([])
const selectedCategory = ref<string>('all')
const query = ref('')
// Preloaded: the sidebar and list only ever paint once with their real data — never an
// intermediate empty/default state that then jumps once the fetch resolves.
const ready = ref(false)

const emptyText = chrome.i18n.getMessage('networkEmpty')
const loadingText = chrome.i18n.getMessage('networkLoading')
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
  try {
    const logResponse = await channel?.send({ type: 'getNetworkLog' })

    if (logResponse?.type === 'networkLogResult') {
      tabId.value = logResponse.tabId
      entries.value = logResponse.entries
    }

    unsubscribe = channel?.subscribe((message) => {
      if (message.type !== 'networkEntryCaptured' || message.tabId !== tabId.value) return
      entries.value = [...entries.value, message.entry]
    })
  } finally {
    // Render with whatever we got, even on failure — a stuck spinner would be worse than
    // falling back to the (already-initialized) defaults.
    ready.value = true
  }
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<template>
  <div :class="ui.viewShell">
    <Breadcrumb view-key="network" />

    <div v-if="!ready" :class="ui.networkEmpty">
      <ArrowPathIcon :class="[ui.networkEmptyIcon, 'animate-spin']" />
      <p>{{ loadingText }}</p>
    </div>

    <div v-else :class="ui.networkLayout">
      <NetworkCategorySidebar :entries="entries" :selected="selectedCategory" @select="selectedCategory = $event" />

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
