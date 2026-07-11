<script setup lang="ts">
import { ref } from 'vue'
import { TrashIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import type { ChatMessage } from '@/shared/messages'
import type { WizardData } from './WizardData'
import CodeEditor from './CodeEditor.vue'
import LlmChatPanel from './LlmChatPanel.vue'

const data = defineModel<WizardData>('data', { required: true })
const emit = defineEmits<{ advance: [] }>()

/** Any edit invalidates a previous test — must be tested again before saving. */
function onCodeChange(value: string): void {
  data.value.code = value
  if (data.value.codeTested) data.value.codeTested = false
}

function onMessagesUpdate(messages: ChatMessage[]): void {
  data.value.chatMessages = messages
}

// Clear needs two clicks: the first arms it (auto-disarms after a few
// seconds), the second actually clears — same pattern as deleting a tool.
const confirmingClear = ref(false)
let disarmTimer: ReturnType<typeof setTimeout> | undefined

function onClearClick(): void {
  if (!confirmingClear.value) {
    confirmingClear.value = true
    disarmTimer = setTimeout(() => (confirmingClear.value = false), 3000)
    return
  }
  clearTimeout(disarmTimer)
  confirmingClear.value = false
  onCodeChange('')
}

const clearLabel = chrome.i18n.getMessage('wizardClearCode')
const clearConfirmLabel = chrome.i18n.getMessage('wizardClearCodeConfirm')
const testLabel = chrome.i18n.getMessage('wizardTestAndSave')
</script>

<template>
  <div :class="ui.wizardChatGrid">
    <LlmChatPanel
      :messages="data.chatMessages"
      :existing-code="data.code"
      @update:messages="onMessagesUpdate"
      @generated="onCodeChange"
    />

    <div :class="ui.wizardChatEditorColumn">
      <CodeEditor :model-value="data.code" @update:model-value="onCodeChange" />

      <div :class="ui.codeEditorActions">
        <button
          type="button"
          :class="confirmingClear ? ui.codeEditorActionButtonDanger : ui.codeEditorActionButton"
          :disabled="data.code.trim() === ''"
          :title="confirmingClear ? clearConfirmLabel : clearLabel"
          @click="onClearClick"
        >
          <TrashIcon :class="ui.codeEditorActionIcon" />
        </button>
        <button
          type="button"
          :class="ui.codeEditorTestButton"
          :disabled="data.code.trim() === ''"
          :title="testLabel"
          @click="emit('advance')"
        >
          {{ testLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
