<script setup lang="ts">
import { inject, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TrashIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { channelKey } from '@/shared/vuePlugins/messaging'
import Breadcrumb from '../components/Breadcrumb.vue'
import LlmChatPanel from '../components/wizard/LlmChatPanel.vue'
import type { ChatMessage } from '@/shared/messages'
import { getChatMessages, saveChatMessages, clearChatMessages } from '@/shared/chatStorage'

const channel = inject(channelKey)
const route = useRoute()
const router = useRouter()

const currentUrl = ref('')
const messages = ref<ChatMessage[]>([])
const chatPanel = ref<InstanceType<typeof LlmChatPanel>>()

/** UTF-8-safe base64 decode inverse of resumer.ts's own encodeBase64. */
function decodeBase64(base64: string): string {
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

const SUGGESTION_KEYS = ['chatSuggestionSummary', 'chatSuggestionKeyPoints', 'chatSuggestionExplain'] as const
const suggestions = SUGGESTION_KEYS.map((key) => chrome.i18n.getMessage(key))

function onSuggestionClick(text: string): void {
  void chatPanel.value?.sendPrompt(text)
}

// Generic "initial content" channel: any content script that opens this view via openEnvironment
// can pass a base64 payload as ?article= (see resumer.ts). Handled by a watcher (started once
// the panel is actually mounted below), not just at mount time: resumer.ts reuses an
// already-open environment's iframe by changing only the URL hash, which doesn't remount this
// component, so a one-shot onMounted check alone would miss a second article arriving while the
// chat is already open.
//
// Stripped from the URL only on LlmChatPanel's 'sent' event (fired once a send fully completes,
// whether directly or via its config-modal retry path), never eagerly: App.vue keys the routed
// component on route.fullPath (query included) for its view-transition animation, so clearing
// the query forces a full remount of this exact component. Doing that right away (before the
// send settles) orphaned the in-flight request on a discarded instance while the freshly
// remounted one showed empty, and it also wiped the "show the LLM config modal" state the
// moment sendPrompt bailed out for missing config, before the modal ever got to render.
function onArticleParam(articleParam: unknown): void {
  if (typeof articleParam !== 'string' || articleParam === '') return
  try {
    const instruction = chrome.i18n.getMessage('resumerSummaryInstruction')
    const content = `${instruction}:\n\n${decodeBase64(articleParam)}`
    void chatPanel.value?.sendPrompt(content, instruction)
  } catch {
    // Malformed param nothing to recover, just drop it below.
  }
}

function onSent(): void {
  void router.replace({ path: route.path })
}

onMounted(async () => {
  const pageResponse = await channel?.send({ type: 'getCurrentPage' })
  currentUrl.value = pageResponse?.type === 'currentPage' ? (pageResponse.url ?? '') : ''
  messages.value = await getChatMessages(currentUrl.value)

  onArticleParam(route.query.article)
  watch(() => route.query.article, onArticleParam)
})

function onMessagesUpdate(next: ChatMessage[]): void {
  messages.value = next
  void saveChatMessages(currentUrl.value, next)
}

// Clear needs two clicks: the first arms it (auto-disarms after a few seconds), the second
// actually clears same pattern as deleting a tool. Scoped to this page's domain only.
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
  messages.value = []
  void clearChatMessages(currentUrl.value)
}

const title = chrome.i18n.getMessage('chatViewTitle')
const subtitle = chrome.i18n.getMessage('chatViewSubtitle')
const clearLabel = chrome.i18n.getMessage('chatClear')
const clearConfirmLabel = chrome.i18n.getMessage('chatClearConfirm')
const emptyText = chrome.i18n.getMessage('chatEmptyText')
</script>

<template>
  <div :class="ui.viewShell">
    <Breadcrumb view-key="chat" />
    <div :class="ui.chatViewport">
      <LlmChatPanel
        ref="chatPanel"
        mode="chat"
        :messages="messages"
        existing-code=""
        :title="title"
        :subtitle="subtitle"
        @update:messages="onMessagesUpdate"
        @sent="onSent"
      >
        <template #header-action>
          <button
            v-if="messages.length > 0"
            type="button"
            :class="confirmingClear ? ui.codeEditorActionButtonDanger : ui.codeEditorActionButton"
            :title="confirmingClear ? clearConfirmLabel : clearLabel"
            @click="onClearClick"
          >
            <TrashIcon :class="ui.codeEditorActionIcon" />
          </button>
        </template>

        <template #empty>
          <p>{{ emptyText }}</p>
          <div :class="ui.chatSuggestionsWrapper">
            <button
              v-for="suggestion in suggestions"
              :key="suggestion"
              type="button"
              :class="ui.chatSuggestionButton"
              @click="onSuggestionClick(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>
        </template>
      </LlmChatPanel>
    </div>
  </div>
</template>
