<script setup lang="ts">
import { inject, reactive, ref, watch } from 'vue'
import { ArrowPathIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { channelKey } from '@/shared/vuePlugins/messaging'
import type { LlmConfig } from '@/shared/preferences'
import { llmErrorText } from '@/shared/llmErrorText'

const emit = defineEmits<{ close: []; saved: [] }>()
const channel = inject(channelKey)

const form = reactive<LlmConfig>({ endpoint: '', apiKey: '', model: '' })

const testing = ref(false)
const saving = ref(false)
const verdict = ref<'idle' | 'ok' | 'error'>('idle')
const errorMessage = ref('')

// Any edit invalidates a previous test — must be tested again before saving.
watch(form, () => (verdict.value = 'idle'))

async function test(): Promise<void> {
  if (!channel) return
  if (!form.endpoint.trim() || !form.apiKey.trim() || !form.model.trim()) {
    verdict.value = 'error'
    errorMessage.value = chrome.i18n.getMessage('llmFieldsRequired')
    return
  }

  testing.value = true
  verdict.value = 'idle'
  const response = await channel.send({ type: 'testLlmConfig', config: { ...form } })
  testing.value = false

  // The background always resolves (it times out internally), but the
  // response is still validated here — the user must never be left hanging
  // without any feedback.
  if (response.type !== 'testLlmConfigResult') {
    verdict.value = 'error'
    errorMessage.value = llmErrorText('unknown', undefined)
    return
  }
  if (response.ok) {
    verdict.value = 'ok'
  } else {
    verdict.value = 'error'
    errorMessage.value = llmErrorText(response.errorCode, response.detail)
  }
}

async function save(): Promise<void> {
  if (!channel || verdict.value !== 'ok') return
  saving.value = true
  await channel.send({ type: 'setPreference', key: 'llmConfig', value: { ...form } })
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
