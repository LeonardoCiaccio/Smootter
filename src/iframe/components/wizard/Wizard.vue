<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, reactive, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { parse } from 'acorn'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { WizardData, toStoredTool } from './WizardData'
import WizardStepBasics from './WizardStepBasics.vue'
import WizardStepTiming from './WizardStepTiming.vue'
import WizardStepScope from './WizardStepScope.vue'
import WizardStepChat from './WizardStepChat.vue'
import WizardStepTester from './WizardStepTester.vue'
import { useToast } from '../../plugins/toast'
import { getTool, saveTool } from '@/shared/toolsDb'
import { quickSaveKey } from './quickSave'

interface StepMeta {
  label: string
  title: string
  subtitle: string
}

// One entry per slide; only 'basics' has a real step component so far.
const stepMessageKeys = [
  { label: 'wizardStepBasics', title: 'wizardStepBasicsTitle', subtitle: 'wizardStepBasicsSubtitle' },
  { label: 'wizardStepTiming', title: 'wizardStepTimingTitle', subtitle: 'wizardStepTimingSubtitle' },
  { label: 'wizardStepScope', title: 'wizardStepScopeTitle', subtitle: 'wizardStepScopeSubtitle' },
  { label: 'wizardStepChat', title: 'wizardStepChatTitle', subtitle: 'wizardStepChatSubtitle' },
  { label: 'wizardStepTester', title: 'wizardStepTesterTitle', subtitle: 'wizardStepTesterSubtitle' },
]

const stepMeta: StepMeta[] = stepMessageKeys.map((keys) => ({
  label: chrome.i18n.getMessage(keys.label),
  title: chrome.i18n.getMessage(keys.title),
  subtitle: chrome.i18n.getMessage(keys.subtitle),
}))

const backLabel = chrome.i18n.getMessage('wizardBack')
const nextLabel = chrome.i18n.getMessage('wizardNext')
const quickSaveLabel = chrome.i18n.getMessage('wizardSaveChanges')

const data = reactive(new WizardData())
const currentIndex = ref(0)
const currentStep = computed(() => stepMeta[currentIndex.value])

// Domain or domain/path, with an optional http(s):// scheme and an optional
// "*." wildcard subdomain prefix.
const DOMAIN_PATTERN =
  /^(https?:\/\/)?(\*\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?:\/\S*)?$/

const route = useRoute()

// Editing a saved tool (vs. creating a new one): lets quick save skip the
// test-then-save flow, since the user may only want to fix e.g. the name.
const isEditing = computed(() => data.id !== null)

// Tracks unsaved changes while editing, to show/hide the quick save button.
// Ignored until the initial load (if any) has finished, so restoring the
// tool's fields below doesn't itself mark the form dirty.
const ready = ref(false)
const dirty = ref(false)

/** If opened via "edit a saved tool", load its data into the wizard. */
onMounted(async () => {
  const editId = route.query.edit
  if (typeof editId === 'string') {
    const tool = await getTool(editId)
    if (tool) {
      data.id = tool.id
      data.createdAt = tool.createdAt
      data.name = tool.name
      data.description = tool.description
      data.trigger = tool.trigger
      data.scope = tool.scope
      data.scopeTargets = tool.scopeTargets
      data.code = tool.code
      data.enabled = tool.enabled
      data.chatMessages = tool.chatMessages ?? []
      // The code was valid when it was saved; only a further edit invalidates it.
      data.codeTested = true
    }
  }
  await nextTick()
  ready.value = true
})

watch(
  () => JSON.stringify(data),
  () => {
    if (ready.value && isEditing.value) dirty.value = true
  },
)

const toast = useToast()

/** Persists every field as-is, without testing — the user decides where to go next. */
async function quickSave(): Promise<void> {
  await saveTool(toStoredTool(data))
  dirty.value = false
  toast.success(chrome.i18n.getMessage('wizardToolSaved'))
}

// BuilderView renders the actual button (next to the breadcrumb); this just drives its state.
const quickSaveController = inject(quickSaveKey)
watchEffect(() => {
  if (!quickSaveController) return
  quickSaveController.value = { visible: isEditing.value && dirty.value, label: quickSaveLabel, save: quickSave }
})
onUnmounted(() => {
  if (quickSaveController) quickSaveController.value = null
})

/** Returns the error message blocking this step, or null if it's complete. */
function validateBasics(): string | null {
  const complete = data.name.trim() !== '' && data.description.trim() !== ''
  return complete ? null : chrome.i18n.getMessage('wizardBasicsRequiredError')
}

function validateScope(): string | null {
  if (data.scope !== 'domain') return null

  const lines = data.scopeTargets
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')

  if (lines.length === 0) return chrome.i18n.getMessage('wizardScopeRequiredError')

  const invalidLine = lines.find((line) => !DOMAIN_PATTERN.test(line))
  if (invalidLine) return `${chrome.i18n.getMessage('wizardScopeInvalidUrl')}: ${invalidLine}`

  return null
}

/**
 * The tester step needs real, syntactically valid code to run. Syntax check
 * only (Acorn, a pure parser — never eval, never executes the code); the
 * tester step then runs it for real.
 */
function validateChat(): string | null {
  if (data.code.trim() === '') return chrome.i18n.getMessage('wizardCodeEmpty')
  try {
    parse(data.code, { ecmaVersion: 'latest', sourceType: 'script' })
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error)
    return `${chrome.i18n.getMessage('wizardCodeInvalid')}: ${details}`
  }
  return null
}

// One validator per slide; steps without a requirement always pass.
const stepValidators: Array<() => string | null> = [
  validateBasics,
  () => null,
  validateScope,
  validateChat,
  () => null,
]

/**
 * Going back is always allowed. Going forward requires every step strictly
 * before the target to be complete (not just the current one — otherwise
 * e.g. jumping from step 1 straight to the tester would skip the code step).
 */
function goTo(index: number): void {
  if (index <= currentIndex.value) {
    currentIndex.value = index
    return
  }

  for (let i = 0; i < index; i++) {
    const error = stepValidators[i]()
    if (error) {
      toast.error(error)
      return
    }
  }
  currentIndex.value = index
}

function goPrev(): void {
  if (currentIndex.value > 0) goTo(currentIndex.value - 1)
}

function goNext(): void {
  if (currentIndex.value < stepMeta.length - 1) goTo(currentIndex.value + 1)
}
</script>

<template>
  <div :class="[ui.wizardWrapperBase, currentIndex === 3 ? ui.wizardWrapperWidthWide : ui.wizardWrapperWidth]">
    <div v-if="currentIndex !== 3" :class="ui.wizardHeader">
      <h1 :class="ui.wizardTitle">{{ currentStep.title }}</h1>
      <p :class="ui.wizardSubtitle">{{ currentStep.subtitle }}</p>
    </div>

    <div :class="ui.wizardBody">
      <WizardStepBasics v-if="currentIndex === 0" v-model:data="data" />
      <WizardStepTiming v-else-if="currentIndex === 1" v-model:data="data" />
      <WizardStepScope v-else-if="currentIndex === 2" v-model:data="data" />
      <WizardStepChat v-else-if="currentIndex === 3" v-model:data="data" @advance="goTo(4)" />
      <WizardStepTester v-else v-model:data="data" @cancel="currentIndex = 3" />
    </div>

    <div :class="ui.wizardSteps">
      <button
        type="button"
        :class="ui.wizardStepArrow"
        :disabled="currentIndex === 0"
        :aria-label="backLabel"
        @click="goPrev"
      >
        <ChevronLeftIcon :class="ui.wizardStepArrowIcon" />
      </button>

      <div :class="ui.wizardStepDots">
        <button
          v-for="(step, index) in stepMeta"
          :key="step.label"
          type="button"
          :class="[ui.wizardStepDot, index === currentIndex && ui.wizardStepDotActive]"
          :aria-label="step.label"
          @click="goTo(index)"
        />
      </div>

      <button
        type="button"
        :class="ui.wizardStepArrow"
        :disabled="currentIndex === stepMeta.length - 1"
        :aria-label="nextLabel"
        @click="goNext"
      >
        <ChevronRightIcon :class="ui.wizardStepArrowIcon" />
      </button>
    </div>
  </div>
</template>
