<script setup lang="ts">
import { inject, nextTick, ref, watch } from 'vue'
import { ArrowPathIcon, PaperAirplaneIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { llmErrorText } from '@/shared/llmErrorText'
import { capChatMessages, type ChatMessage } from '@/shared/messages'
import LlmConfigModal from './LlmConfigModal.vue'

const props = defineProps<{
  messages: ChatMessage[]
  existingCode: string
  // Overridable so the same panel can be reused outside the wizard (see ChatView.vue) with
  // copy that doesn't imply the conversation is about building a tool.
  title?: string
  subtitle?: string
  emptyText?: string
}>()
const emit = defineEmits<{ 'update:messages': [messages: ChatMessage[]]; generated: [code: string] }>()

const channel = inject(channelKey)
const prompt = ref('')
const generating = ref(false)
const messagesEl = ref<HTMLDivElement>()

const showConfigModal = ref(false)

async function scrollToBottom(): Promise<void> {
  await nextTick()
  messagesEl.value?.scrollTo({ top: messagesEl.value.scrollHeight })
}

watch(() => props.messages.length, scrollToBottom)

/**
 * The conversation carries the context every turn resends the full history so far.
 * `overrideText` lets a caller outside this component send a prompt directly (see
 * ChatView.vue's suggestion buttons, via defineExpose below) without going through the textarea.
 */
async function send(overrideText?: string): Promise<void> {
  if (!channel || generating.value) return
  const text = (overrideText ?? prompt.value).trim()
  if (text === '') return

  const configResponse = await channel.send({ type: 'getPreference', key: 'llmConfig' })
  const configured = configResponse.type === 'preferenceValue' && Boolean(configResponse.value)
  if (!configured) {
    showConfigModal.value = true
    return
  }

  const nextMessages = capChatMessages([...props.messages, { role: 'user', content: text }])
  emit('update:messages', nextMessages)
  if (overrideText === undefined) prompt.value = ''

  generating.value = true
  const response = await channel.send({
    type: 'generateCode',
    messages: nextMessages,
    existingCode: props.existingCode,
  })
  generating.value = false

  if (response.type !== 'generateCodeResult' || !response.ok) {
    const errorCode = response.type === 'generateCodeResult' ? response.errorCode : 'unknown'
    const detail = response.type === 'generateCodeResult' ? response.detail : undefined
    emit('update:messages', capChatMessages([
      ...nextMessages,
      { role: 'assistant', content: llmErrorText(errorCode, detail) },
    ]))
    return
  }

  // Only the chat-facing reply goes in the transcript the code is applied
  // to the editor directly, never printed here. Not every turn writes code
  // (a greeting or question doesn't) only touch the editor when it does.
  emit('update:messages', capChatMessages([...nextMessages, { role: 'assistant', content: response.reply ?? '' }]))
  if (response.code) emit('generated', response.code)
}

function onConfigSaved(): void {
  showConfigModal.value = false
  void send()
}

defineExpose({ sendPrompt: (text: string) => send(text) })

const title = props.title ?? chrome.i18n.getMessage('wizardStepChatTitle')
const subtitle = props.subtitle ?? chrome.i18n.getMessage('wizardStepChatSubtitle')
const emptyText = props.emptyText ?? chrome.i18n.getMessage('llmChatEmpty')
const promptPlaceholder = chrome.i18n.getMessage('llmPromptPlaceholder')
const sendLabel = chrome.i18n.getMessage('llmPromptSend')
</script>

<template>
  <div :class="ui.wizardChatColumn">
    <div :class="ui.wizardChatHeaderRow">
      <div :class="ui.wizardChatHeader">
        <h1 :class="ui.wizardChatTitle">{{ title }}</h1>
        <p :class="ui.wizardChatSubtitle">{{ subtitle }}</p>
      </div>
      <slot name="header-action" />
    </div>

    <div ref="messagesEl" :class="ui.wizardChatMessages">
      <div v-if="messages.length === 0" :class="ui.wizardChatEmpty">
        <slot name="empty">
          <p>{{ emptyText }}</p>
        </slot>
      </div>
      <template v-else>
        <p
          v-for="(message, index) in messages"
          :key="index"
          :class="message.role === 'user' ? ui.wizardChatBubbleUser : ui.wizardChatBubbleAssistant"
        >
          {{ message.content }}
        </p>
      </template>
    </div>

    <div :class="ui.wizardChatInputWrapper">
      <textarea
        v-model="prompt"
        rows="2"
        :class="ui.wizardChatInput"
        :placeholder="promptPlaceholder"
        @keydown.enter.exact.prevent="send()"
      />
      <button
        type="button"
        :class="ui.wizardChatSendButton"
        :disabled="generating || prompt.trim() === ''"
        :title="sendLabel"
        @click="send()"
      >
        <ArrowPathIcon v-if="generating" :class="[ui.toolbarIcon, 'animate-spin']" />
        <PaperAirplaneIcon v-else :class="ui.toolbarIcon" />
      </button>
    </div>

    <LlmConfigModal
      v-if="showConfigModal"
      @close="showConfigModal = false"
      @saved="onConfigSaved"
    />
  </div>
</template>
