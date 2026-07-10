<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { useToast } from '../plugins/toast'
import { useLlmConfigForm } from '../composables/useLlmConfigForm'

const toast = useToast()
const { form, testing, verdict, errorMessage, loadSaved, test, persist, clear } = useLlmConfigForm()

const saving = ref(false)
const hasSavedConfig = ref(false)

onMounted(async () => {
  hasSavedConfig.value = await loadSaved()
})

async function save(): Promise<void> {
  if (verdict.value !== 'ok') return
  saving.value = true
  await persist()
  saving.value = false
  hasSavedConfig.value = true
  toast.success(chrome.i18n.getMessage('llmConfigSaved'))
}

// Reset needs two clicks: the first arms it (auto-disarms after a few
// seconds), the second actually clears — same pattern as deleting a tool.
const confirmingReset = ref(false)
let disarmTimer: ReturnType<typeof setTimeout> | undefined

async function onResetClick(): Promise<void> {
  if (!confirmingReset.value) {
    confirmingReset.value = true
    disarmTimer = setTimeout(() => (confirmingReset.value = false), 3000)
    return
  }

  clearTimeout(disarmTimer)
  confirmingReset.value = false
  await clear()
  hasSavedConfig.value = false
  toast.success(chrome.i18n.getMessage('llmConfigReset'))
}

const sectionTitle = chrome.i18n.getMessage('llmGroupTitle')
const sectionDescription = chrome.i18n.getMessage('llmSettingsDescription')
const endpointLabel = chrome.i18n.getMessage('llmEndpointLabel')
const apiKeyLabel = chrome.i18n.getMessage('llmApiKeyLabel')
const modelLabel = chrome.i18n.getMessage('llmModelLabel')
const testLabel = chrome.i18n.getMessage('wizardTest')
const saveLabel = chrome.i18n.getMessage('wizardSave')
const resetLabel = chrome.i18n.getMessage('llmConfigResetButton')
const resetConfirmLabel = chrome.i18n.getMessage('llmConfigResetConfirm')
const okText = chrome.i18n.getMessage('llmTestOk')
</script>

<template>
  <div :class="ui.optionsSection">
    <div>
      <p :class="ui.optionsSectionTitle">{{ sectionTitle }}</p>
      <p :class="ui.optionsSectionDescription">{{ sectionDescription }}</p>
    </div>

    <label :class="ui.wizardField">
      <span :class="ui.wizardFieldLabel">{{ endpointLabel }}</span>
      <input v-model.trim="form.endpoint" type="text" :class="ui.input" />
    </label>
    <label :class="ui.wizardField">
      <span :class="ui.wizardFieldLabel">{{ apiKeyLabel }}</span>
      <input v-model.trim="form.apiKey" type="password" :class="ui.input" />
    </label>
    <label :class="ui.wizardField">
      <span :class="ui.wizardFieldLabel">{{ modelLabel }}</span>
      <input v-model.trim="form.model" type="text" :class="ui.input" />
    </label>

    <p v-if="verdict === 'ok'" :class="ui.modalStatusOk">{{ okText }}</p>
    <p v-else-if="verdict === 'error'" :class="ui.modalStatusError">{{ errorMessage }}</p>

    <div :class="ui.optionsSectionActions">
      <button
        type="button"
        :class="confirmingReset ? ui.dangerButton : ui.secondaryButton"
        :disabled="!hasSavedConfig"
        @click="onResetClick"
      >
        {{ confirmingReset ? resetConfirmLabel : resetLabel }}
      </button>
      <div :class="ui.modalActions">
        <button type="button" :class="ui.secondaryButton" :disabled="testing" @click="test">
          <ArrowPathIcon v-if="testing" :class="[ui.toolbarIcon, 'animate-spin']" />
          {{ testLabel }}
        </button>
        <button
          type="button"
          :class="ui.primaryButton"
          :disabled="verdict !== 'ok' || saving"
          @click="save"
        >
          {{ saveLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
