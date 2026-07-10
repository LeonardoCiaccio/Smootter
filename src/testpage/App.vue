<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { ui } from '@/styles/ui'
import { channelKey } from '@/shared/vuePlugins/messaging'

// Set by main.ts's early `error` listener — the supervisor.
declare global {
  interface Window {
    __pippoTestError?: string
  }
}

// Give the registered script (document_start or document_idle, per the
// tool's trigger) time to actually run before reading the verdict.
const VERDICT_DELAY_MS = 700

const channel = inject(channelKey)
const status = ref(chrome.i18n.getMessage('testPageWaiting'))
const verdict = ref<'waiting' | 'ok' | 'error'>('waiting')

const requestId = new URLSearchParams(location.search).get('rid') ?? ''

const statusClass = computed(() => {
  if (verdict.value === 'error') return ui.testPageStatusError
  if (verdict.value === 'ok') return ui.testPageStatusOk
  return ui.testPageStatusWaiting
})

onMounted(() => {
  setTimeout(() => {
    const caught = window.__pippoTestError
    if (caught) {
      verdict.value = 'error'
      status.value = `${chrome.i18n.getMessage('wizardRuntimeError')}: ${caught}`
    } else {
      verdict.value = 'ok'
      status.value = chrome.i18n.getMessage('testPageCodeCorrect')
    }
    channel?.send({ type: 'reportTestResult', requestId, ok: !caught, error: caught })
  }, VERDICT_DELAY_MS)
})
</script>

<template>
  <div :class="ui.testPageWrapper">
    <p :class="statusClass">{{ status }}</p>
  </div>
</template>
