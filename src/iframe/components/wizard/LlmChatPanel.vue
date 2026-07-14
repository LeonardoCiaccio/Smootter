<script setup lang="ts">
import { inject, nextTick, ref, watch } from 'vue'
import { ArrowPathIcon, PaperAirplaneIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { llmErrorText } from '@/shared/llmErrorText'
import { capChatMessages, type ChatMessage } from '@/shared/messages'
import type { LlmConfig } from '@/shared/preferences'
import LlmConfigModal from './LlmConfigModal.vue'

const props = defineProps<{
  messages: ChatMessage[]
  existingCode: string
  // Overridable so the same panel can be reused outside the wizard (see ChatView.vue) with
  // copy that doesn't imply the conversation is about building a tool.
  title?: string
  subtitle?: string
  emptyText?: string
  // 'code' (default) drives the wizard's tool-building conversation (generateCode, applies
  // `code` to the editor via the `generated` event). 'chat' drives the Chat view's plain,
  // general-purpose conversation (chatMessage, its own separate system prompt no code applied).
  mode?: 'code' | 'chat'
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
 * `displayText`, when given, is shown in the bubble instead of `overrideText` (e.g. resumer.ts's
 * short "summarize this article" instruction standing in for the full article text) the LLM
 * and stored history still get the full `overrideText` either way.
 */
async function send(overrideText?: string, displayText?: string): Promise<void> {
  if (!channel || generating.value) return
  const text = (overrideText ?? prompt.value).trim()
  if (text === '') return

  const configResponse = await channel.send({ type: 'getPreference', key: 'llmConfig' })
  const llmConfig = configResponse.type === 'preferenceValue' ? (configResponse.value as LlmConfig | undefined) : undefined
  // apiKey is legitimately optional (local runtimes like Ollama don't need one) endpoint and
  // model are not. Boolean(value) alone is always true for an empty {}, which let an unset
  // config sail through this check and fail silently later at the actual chat call.
  const configured = Boolean(llmConfig?.endpoint) && Boolean(llmConfig?.model)
  if (!configured) {
    showConfigModal.value = true
    return
  }

  const nextMessages = capChatMessages([
    ...props.messages,
    { role: 'user', content: text, displayContent: displayText },
  ])
  emit('update:messages', nextMessages)
  if (overrideText === undefined) prompt.value = ''

  generating.value = true
  const response =
    props.mode === 'chat'
      ? await channel.send({ type: 'chatMessage', messages: nextMessages })
      : await channel.send({ type: 'generateCode', messages: nextMessages, existingCode: props.existingCode })
  generating.value = false

  const expectedType = props.mode === 'chat' ? 'chatMessageResult' : 'generateCodeResult'
  if (response.type !== expectedType || !response.ok) {
    const errorCode = response.type === expectedType ? response.errorCode : 'unknown'
    const detail = response.type === expectedType ? response.detail : undefined
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
  if (response.type === 'generateCodeResult' && response.code) emit('generated', response.code)
}

function onConfigSaved(): void {
  showConfigModal.value = false
  void send()
}

defineExpose({ sendPrompt: (text: string, displayText?: string) => send(text, displayText) })

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
          {{ message.displayContent ?? message.content }}
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
