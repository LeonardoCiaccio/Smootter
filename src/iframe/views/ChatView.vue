<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import { TrashIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { channelKey } from '@/shared/vuePlugins/messaging'
import Breadcrumb from '../components/Breadcrumb.vue'
import LlmChatPanel from '../components/wizard/LlmChatPanel.vue'
import type { ChatMessage } from '@/shared/messages'
import { getChatMessages, saveChatMessages, clearChatMessages } from '@/shared/chatStorage'

const channel = inject(channelKey)

const currentUrl = ref('')
const messages = ref<ChatMessage[]>([])
const chatPanel = ref<InstanceType<typeof LlmChatPanel>>()

const SUGGESTION_KEYS = ['chatSuggestionSummary', 'chatSuggestionKeyPoints', 'chatSuggestionExplain'] as const
const suggestions = SUGGESTION_KEYS.map((key) => chrome.i18n.getMessage(key))

function onSuggestionClick(text: string): void {
  void chatPanel.value?.sendPrompt(text)
}

onMounted(async () => {
  const pageResponse = await channel?.send({ type: 'getCurrentPage' })
  currentUrl.value = pageResponse?.type === 'currentPage' ? (pageResponse.url ?? '') : ''
  messages.value = await getChatMessages(currentUrl.value)
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
        :messages="messages"
        existing-code=""
        :title="title"
        :subtitle="subtitle"
        @update:messages="onMessagesUpdate"
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
