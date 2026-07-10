<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ui } from '@/styles/ui'
import { useToast } from '../../plugins/toast'
import { saveTool, type StoredTool } from '@/shared/toolsDb'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { capChatMessages } from '@/shared/messages'
import type { WizardData } from './WizardData'

const data = defineModel<WizardData>('data', { required: true })
const toast = useToast()
const router = useRouter()
const channel = inject(channelKey)

const verdict = ref<'running' | 'ok' | 'error'>('running')
const errorDetails = ref('')

const statusClass = computed(() => {
  if (verdict.value === 'error') return ui.testStatusError
  if (verdict.value === 'ok') return ui.testStatusOk
  return ui.testStatusWaiting
})
const statusText = computed(() => {
  if (verdict.value === 'error') return `${chrome.i18n.getMessage('wizardRuntimeError')}: ${errorDetails.value}`
  if (verdict.value === 'ok') return chrome.i18n.getMessage('wizardTestPassed')
  return chrome.i18n.getMessage('wizardTesterRunning')
})

/** Runs the tool's code for real, governed by the background worker. */
async function runTest(): Promise<void> {
  if (!channel) return

  verdict.value = 'running'
  data.value.codeTested = false

  const response = await channel.send({ type: 'testCode', code: data.value.code })
  if (response.type !== 'testCodeResult') return

  if (response.ok) {
    verdict.value = 'ok'
    data.value.codeTested = true
  } else {
    verdict.value = 'error'
    errorDetails.value = response.error ?? ''
  }
}

onMounted(runTest)

async function save(): Promise<void> {
  const tool: StoredTool = {
    id: data.value.id ?? crypto.randomUUID(),
    name: data.value.name,
    description: data.value.description,
    trigger: data.value.trigger ?? 'pageStart',
    scope: data.value.scope,
    scopeTargets: data.value.scopeTargets,
    code: data.value.code,
    enabled: data.value.enabled,
    chatMessages: capChatMessages(data.value.chatMessages),
    createdAt: data.value.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  }
  await saveTool(tool)
  toast.success(chrome.i18n.getMessage('wizardToolSaved'))
  // ToolsPanel fetches its list on mount, so returning Home reloads it fresh.
  router.push('/')
}

const saveLabel = chrome.i18n.getMessage('wizardSave')
</script>

<template>
  <div :class="ui.wizardTesterBody">
    <p :class="statusClass">{{ statusText }}</p>
    <button v-if="verdict === 'ok'" type="button" :class="ui.primaryButton" @click="save">
      {{ saveLabel }}
    </button>
  </div>
</template>
