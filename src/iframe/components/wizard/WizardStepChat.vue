<script setup lang="ts">
import { inject, ref } from 'vue'
import { SparklesIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { channelKey } from '@/shared/vuePlugins/messaging'
import type { WizardData } from './WizardData'
import CodeEditor from './CodeEditor.vue'
import LlmConfigModal from './LlmConfigModal.vue'
import GeneratePromptModal from './GeneratePromptModal.vue'

const data = defineModel<WizardData>('data', { required: true })
const channel = inject(channelKey)

/** Any edit invalidates a previous test — must be tested again before saving. */
function onCodeChange(value: string): void {
  data.value.code = value
  if (data.value.codeTested) data.value.codeTested = false
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

const showConfigModal = ref(false)
const showPromptModal = ref(false)

/** The AI icon: opens setup if the LLM isn't configured yet, otherwise the prompt popup. */
async function onAiClick(): Promise<void> {
  if (!channel) return
  const response = await channel.send({ type: 'getPreference', key: 'llmConfig' })
  const configured = response.type === 'preferenceValue' && Boolean(response.value)
  if (configured) showPromptModal.value = true
  else showConfigModal.value = true
}

/** After saving a fresh config, go straight to the prompt popup. */
function onConfigSaved(): void {
  showConfigModal.value = false
  showPromptModal.value = true
}

function onGenerated(code: string): void {
  showPromptModal.value = false
  onCodeChange(code)
}

const clearLabel = chrome.i18n.getMessage('wizardClearCode')
const clearConfirmLabel = chrome.i18n.getMessage('wizardClearCodeConfirm')
const aiLabel = chrome.i18n.getMessage('llmButtonLabel')
</script>

<template>
  <div :class="ui.wizardStepBodyFill">
    <div :class="ui.codeEditorWrapper">
      <CodeEditor :model-value="data.code" @update:model-value="onCodeChange" />

      <div :class="ui.codeEditorActions">
        <button
          type="button"
          :class="confirmingClear ? ui.codeEditorActionButtonDanger : ui.codeEditorActionButton"
          :title="confirmingClear ? clearConfirmLabel : clearLabel"
          @click="onClearClick"
        >
          <TrashIcon :class="ui.codeEditorActionIcon" />
        </button>
        <button
          type="button"
          :class="ui.codeEditorActionButtonAi"
          :title="aiLabel"
          @click="onAiClick"
        >
          <SparklesIcon :class="ui.codeEditorActionIcon" />
        </button>
      </div>
    </div>

    <LlmConfigModal
      v-if="showConfigModal"
      @close="showConfigModal = false"
      @saved="onConfigSaved"
    />
    <GeneratePromptModal
      v-if="showPromptModal"
      :existing-code="data.code"
      @close="showPromptModal = false"
      @generated="onGenerated"
    />
  </div>
</template>
