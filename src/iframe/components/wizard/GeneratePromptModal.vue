<script setup lang="ts">
import { inject, ref } from 'vue'
import { ArrowPathIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { useToast } from '../../plugins/toast'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { llmErrorText } from '@/shared/llmErrorText'

const emit = defineEmits<{ close: []; generated: [code: string] }>()
const toast = useToast()
const channel = inject(channelKey)

const prompt = ref('')
const generating = ref(false)

async function generate(): Promise<void> {
  if (!channel || generating.value) return
  if (prompt.value.trim() === '') {
    toast.error(chrome.i18n.getMessage('llmPromptEmpty'))
    return
  }

  generating.value = true
  const response = await channel.send({ type: 'generateCode', prompt: prompt.value })
  generating.value = false

  if (response.type !== 'generateCodeResult' || !response.ok) {
    const errorCode = response.type === 'generateCodeResult' ? response.errorCode : 'unknown'
    const detail = response.type === 'generateCodeResult' ? response.detail : undefined
    toast.error(llmErrorText(errorCode, detail))
    return
  }

  toast.success(chrome.i18n.getMessage('llmGenerateOk'))
  emit('generated', response.code ?? '')
}

const title = chrome.i18n.getMessage('llmButtonLabel')
const promptPlaceholder = chrome.i18n.getMessage('llmPromptPlaceholder')
const generateLabel = chrome.i18n.getMessage('llmPromptSend')
const cancelLabel = chrome.i18n.getMessage('llmPromptCancel')
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

        <textarea v-model="prompt" rows="4" :class="ui.input" :placeholder="promptPlaceholder" />

        <div :class="ui.modalActions">
          <button type="button" :class="ui.secondaryButton" :disabled="generating" @click="emit('close')">
            {{ cancelLabel }}
          </button>
          <button type="button" :class="ui.primaryButton" :disabled="generating" @click="generate">
            <ArrowPathIcon v-if="generating" :class="[ui.toolbarIcon, 'animate-spin']" />
            {{ generateLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
