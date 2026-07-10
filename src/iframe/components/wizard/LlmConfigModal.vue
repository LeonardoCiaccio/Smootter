<script setup lang="ts">
import { ref } from 'vue'
import { ArrowPathIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { useLlmConfigForm } from '../../composables/useLlmConfigForm'

const emit = defineEmits<{ close: []; saved: [] }>()
const { form, testing, verdict, errorMessage, test, persist } = useLlmConfigForm()

const saving = ref(false)

async function save(): Promise<void> {
  if (verdict.value !== 'ok') return
  saving.value = true
  await persist()
  saving.value = false
  emit('saved')
}

const title = chrome.i18n.getMessage('llmConfigTitle')
const endpointLabel = chrome.i18n.getMessage('llmEndpointLabel')
const apiKeyLabel = chrome.i18n.getMessage('llmApiKeyLabel')
const modelLabel = chrome.i18n.getMessage('llmModelLabel')
const testLabel = chrome.i18n.getMessage('wizardTest')
const saveLabel = chrome.i18n.getMessage('wizardSave')
const okText = chrome.i18n.getMessage('llmTestOk')
</script>

<template>
  <Teleport to="body">
    <div :class="ui.modalOverlay" @click.self="emit('close')">
      <div :class="ui.modalPanel">
        <div :class="ui.modalHeader">
          <span :class="ui.modalTitle">{{ title }}</span>
          <button type="button" :class="ui.toolbarIconButton" @click="emit('close')">
            <XMarkIcon :class="ui.toolbarIcon" />
          </button>
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
  </Teleport>
</template>
