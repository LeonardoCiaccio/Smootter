<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import { SignalIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import Breadcrumb from '../components/Breadcrumb.vue'
import NetworkCategorySidebar from '../components/NetworkCategorySidebar.vue'
import NetworkEntryRow from '../components/NetworkEntryRow.vue'
import { channelKey } from '@/shared/vuePlugins/messaging'
import type { NetworkEntry, NetworkEntryCategory } from '@/shared/messages'

const channel = inject(channelKey)

const tabId = ref<number | null>(null)
const entries = ref<NetworkEntry[]>([])
const selectedCategory = ref<NetworkEntryCategory | 'all'>('all')

const emptyText = chrome.i18n.getMessage('networkEmpty')

const visibleEntries = computed(() =>
  selectedCategory.value === 'all' ? entries.value : entries.value.filter((entry) => entry.category === selectedCategory.value),
)

let unsubscribe: (() => void) | undefined

onMounted(async () => {
  const response = await channel?.send({ type: 'getNetworkLog' })
  if (response?.type === 'networkLogResult') {
    tabId.value = response.tabId
    entries.value = response.entries
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
      <NetworkCategorySidebar :entries="entries" :selected="selectedCategory" @select="selectedCategory = $event" />

      <div :class="ui.networkMain">
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
