<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { cancelImport, confirmImport, pendingImport } from '../composables/importFlow'

const includeTools = ref(true)
const includeBookmarklets = ref(true)
// Opt-in, not opt-out: this endpoint is where every future prompt (page URLs, page content,
// the API key the user re-enters afterward) gets sent. A shared bundle could point it anywhere 
// importing it by default, pre-checked like everything else, is how that goes unnoticed.
const includeLlmConfig = ref(false)
const includeNetworkConfig = ref(true)

// Re-arm each time a new pending import shows up (llmConfig always starts unchecked).
watch(pendingImport, () => {
  includeTools.value = true
  includeBookmarklets.value = true
  includeLlmConfig.value = false
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
          <span>
            {{ llmConfigLabel }}
            <!-- The endpoint every future prompt would be sent to shown in the clear so the
                 user can recognize (or reject) it before accepting it from someone else's file. -->
            <code :class="ui.importConfirmEndpoint">{{ pendingImport.llmConfig.endpoint }}</code>
          </span>
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
