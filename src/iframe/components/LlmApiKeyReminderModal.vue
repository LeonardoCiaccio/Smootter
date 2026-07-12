<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { llmApiKeyReminderVisible } from '../composables/llmApiKeyReminder'

const title = chrome.i18n.getMessage('llmApiKeyReminderTitle')
const message = chrome.i18n.getMessage('llmApiKeyReminderMessage')
const okLabel = chrome.i18n.getMessage('llmApiKeyReminderOk')

function close(): void {
  llmApiKeyReminderVisible.value = false
}
</script>

<template>
  <Teleport to="body">
    <div v-if="llmApiKeyReminderVisible" :class="ui.modalOverlay" @click.self="close">
      <div :class="ui.modalPanel">
        <div :class="ui.modalHeader">
          <span :class="ui.modalTitle">{{ title }}</span>
          <button type="button" :class="ui.toolbarIconButton" @click="close">
            <XMarkIcon :class="ui.toolbarIcon" />
          </button>
        </div>

        <p :class="ui.modalBodyText">{{ message }}</p>

        <div :class="ui.modalActions">
          <button type="button" :class="ui.primaryButton" @click="close">{{ okLabel }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
