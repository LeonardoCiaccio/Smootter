<script setup lang="ts">
import { inject, nextTick, ref, watch } from 'vue'
import { ArrowPathIcon, PaperAirplaneIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { llmErrorText } from '@/shared/llmErrorText'
import { capChatMessages, type ChatMessage } from '@/shared/messages'
import type { LlmConfig } from '@/shared/preferences'
import { renderMarkdown } from '@/shared/renderMarkdown'
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
// 'sent' fires whenever a send() call actually completes (reply or error reply), whether that
// happened directly or via the config-modal retry path (see onConfigSaved) lets ChatView.vue
// know it's safe to clear a one-shot route param (e.g. resumer.ts's ?article=) regardless of
// which path delivered the completion.
const emit = defineEmits<{
  'update:messages': [messages: ChatMessage[]]
  generated: [code: string]
  sent: []
}>()

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
 *
 * Returns whether a full attempt actually happened (got a reply, success or error) as opposed to
 * bailing out early (missing config, already generating, empty text). ChatView.vue uses this to
 * know whether it's now safe to clear ?article= from the route a caller that clears it right
 * after opening the config modal would force a remount (App.vue keys the route on the full path,
 * query included) and wipe the just-set "show the config modal" state before it ever rendered.
 */
async function send(overrideText?: string, displayText?: string): Promise<boolean> {
  if (!channel || generating.value) return false
  const text = (overrideText ?? prompt.value).trim()
  if (text === '') return false

  const configResponse = await channel.send({ type: 'getPreference', key: 'llmConfig' })
  const llmConfig = configResponse.type === 'preferenceValue' ? (configResponse.value as LlmConfig | undefined) : undefined
  // apiKey is legitimately optional (local runtimes like Ollama don't need one) endpoint and
  // model are not. Boolean(value) alone is always true for an empty {}, which let an unset
  // config sail through this check and fail silently later at the actual chat call.
  const configured = Boolean(llmConfig?.endpoint) && Boolean(llmConfig?.model)
  if (!configured) {
    pendingSend = { overrideText, displayText }
    showConfigModal.value = true
    return false
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
    emit('sent')
    return true
  }

  // Only the chat-facing reply goes in the transcript the code is applied
  // to the editor directly, never printed here. Not every turn writes code
  // (a greeting or question doesn't) only touch the editor when it does.
  emit('update:messages', capChatMessages([...nextMessages, { role: 'assistant', content: response.reply ?? '' }]))
  if (response.type === 'generateCodeResult' && response.code) emit('generated', response.code)
  emit('sent')
  return true
}

// Set right before showConfigModal opens: what to resend once the user finishes configuring,
// since a bare retry would otherwise pick up the (empty) textarea instead of the original
// request the config modal interrupted (e.g. resumer.ts's article hand-off).
let pendingSend: { overrideText?: string; displayText?: string } | undefined

function onConfigSaved(): void {
  showConfigModal.value = false
  const resend = pendingSend
  pendingSend = undefined
  void send(resend?.overrideText, resend?.displayText)
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
        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="message.role === 'user' ? ui.wizardChatBubbleUser : ui.wizardChatBubbleAssistant"
          v-html="renderMarkdown(message.displayContent ?? message.content)"
        />
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
