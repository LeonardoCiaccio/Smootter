<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { cancelImport, confirmImport, pendingImport } from '../composables/importFlow'

const includeTools = ref(true)
const includeBookmarklets = ref(true)
const includeLlmConfig = ref(true)
const includeNetworkConfig = ref(true)

// Re-arm all checkboxes (checked) each time a new pending import shows up.
watch(pendingImport, () => {
  includeTools.value = true
  includeBookmarklets.value = true
  includeLlmConfig.value = true
  includeNetworkConfig.value = true
})

const title = chrome.i18n.getMessage('importConfirmTitle')
const toolsLabel = computed(() =>
  chrome.i18n.getMessage('importConfirmTools', [String(pendingImport.value?.tools.length ?? 0)]),
)
const bookmarkletsLabel = computed(() =>
  chrome.i18n.getMessage('importConfirmBookmarklets', [String(pendingImport.value?.bookmarkletCandidates.length ?? 0)]),
)
const llmConfigLabel = chrome.i18n.getMessage('importConfirmLlmConfig')
const networkConfigLabel = chrome.i18n.getMessage('importConfirmNetworkConfig')
const confirmLabel = chrome.i18n.getMessage('importConfirmButton')
const cancelLabel = chrome.i18n.getMessage('importConfirmCancel')

function onConfirm(): void {
  confirmImport({
    tools: includeTools.value,
    bookmarklets: includeBookmarklets.value,
    llmConfig: includeLlmConfig.value,
    networkConfig: includeNetworkConfig.value,
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="pendingImport" :class="ui.modalOverlay" @click.self="cancelImport">
      <div :class="ui.modalPanel">
        <div :class="ui.modalHeader">
          <span :class="ui.modalTitle">{{ title }}</span>
          <button type="button" :class="ui.toolbarIconButton" @click="cancelImport">
            <XMarkIcon :class="ui.toolbarIcon" />
          </button>
        </div>

        <label v-if="pendingImport.tools.length > 0" :class="ui.importConfirmOption">
          <input v-model="includeTools" type="checkbox" :class="ui.importConfirmCheckbox" />
          <span>{{ toolsLabel }}</span>
        </label>
        <label v-if="pendingImport.bookmarkletCandidates.length > 0" :class="ui.importConfirmOption">
          <input v-model="includeBookmarklets" type="checkbox" :class="ui.importConfirmCheckbox" />
          <span>{{ bookmarkletsLabel }}</span>
        </label>
        <label v-if="pendingImport.llmConfig" :class="ui.importConfirmOption">
          <input v-model="includeLlmConfig" type="checkbox" :class="ui.importConfirmCheckbox" />
          <span>{{ llmConfigLabel }}</span>
        </label>
        <label v-if="pendingImport.networkConfig" :class="ui.importConfirmOption">
          <input v-model="includeNetworkConfig" type="checkbox" :class="ui.importConfirmCheckbox" />
          <span>{{ networkConfigLabel }}</span>
        </label>

        <div :class="ui.modalActions">
          <button type="button" :class="ui.secondaryButton" @click="cancelImport">{{ cancelLabel }}</button>
          <button type="button" :class="ui.primaryButton" @click="onConfirm">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
