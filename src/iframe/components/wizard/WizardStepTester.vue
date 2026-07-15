<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import confetti from 'canvas-confetti'
import { SparklesIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { useToast } from '../../plugins/toast'
import { saveTool } from '@/shared/toolsDb'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { scanForRiskyPatterns } from '@/shared/codeRiskScan'
import { toStoredTool, type WizardData } from './WizardData'

const data = defineModel<WizardData>('data', { required: true })
const emit = defineEmits<{ cancel: [] }>()
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Even when the real test finishes almost instantly, a bare flash of text
// doesn't read as "we actually built and ran your tool" a short minimum
// keeps the processing animation on screen long enough to feel real.
const MIN_ANIMATION_MS = 2000

/** Runs the tool's code for real, governed by the background worker. */
async function runTest(): Promise<void> {
  if (!channel) return

  verdict.value = 'running'
  data.value.codeTested = false

  const startedAt = Date.now()
  const response = await channel.send({ type: 'testCode', code: data.value.code })
  const elapsed = Date.now() - startedAt
  if (elapsed < MIN_ANIMATION_MS) await sleep(MIN_ANIMATION_MS - elapsed)

  if (response.type !== 'testCodeResult') return

  if (response.ok) {
    verdict.value = 'ok'
    data.value.codeTested = true
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
  } else {
    verdict.value = 'error'
    errorDetails.value = response.error ?? ''
  }
}

onMounted(runTest)

async function save(): Promise<void> {
  if (verdict.value !== 'ok') return
  await saveTool(toStoredTool(data.value))
  toast.success(chrome.i18n.getMessage('wizardToolSaved'))
  // ToolsPanel fetches its list on mount, so returning to Tools reloads it fresh.
  router.push('/tools')
}

const saveLabel = chrome.i18n.getMessage('wizardSave')
const cancelLabel = chrome.i18n.getMessage('wizardTesterCancel')
const reviewNoticeText = chrome.i18n.getMessage('wizardTesterReviewNotice')
const riskWarningText = chrome.i18n.getMessage('wizardTesterRiskWarning')
// Non-blocking heuristic: flags code that both reads storage and sends network requests, the
// combination a prompt-injected exfiltration snippet needs. A false positive never blocks save
// this is a platform for arbitrary user code, not a code reviewer.
const isRisky = computed(() => scanForRiskyPatterns(data.value.code))
</script>

<template>
  <div :class="ui.wizardTesterBody">
    <div v-if="verdict === 'running'" :class="ui.wizardTesterSpinnerWrapper">
      <div :class="ui.wizardTesterSpinnerTrack" />
      <div :class="ui.wizardTesterSpinnerArc" />
      <SparklesIcon :class="ui.wizardTesterSpinnerIcon" />
    </div>

    <p :class="statusClass">{{ statusText }}</p>
    <!-- "Passed" only means it ran without throwing never a claim that the code is safe or
         does what was asked. The user is the last check before it runs on real pages. -->
    <p v-if="verdict === 'ok'" :class="ui.wizardTesterReviewNotice">{{ reviewNoticeText }}</p>
    <p v-if="verdict === 'ok' && isRisky" :class="ui.wizardTesterRiskWarning">{{ riskWarningText }}</p>

    <div v-if="verdict !== 'running'" :class="ui.wizardTesterActions">
      <button type="button" :class="ui.secondaryButton" @click="emit('cancel')">
        {{ cancelLabel }}
      </button>
      <button v-if="verdict === 'ok'" type="button" :class="ui.primaryButton" @click="save">
        {{ saveLabel }}
      </button>
    </div>
  </div>
</template>
