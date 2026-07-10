<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ui } from '@/styles/ui'
import { WizardData } from './WizardData'
import WizardStepBasics from './WizardStepBasics.vue'
import WizardStepTiming from './WizardStepTiming.vue'
import WizardStepScope from './WizardStepScope.vue'
import WizardStepPlaceholder from './WizardStepPlaceholder.vue'
import { useToast } from '../../plugins/toast'

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
]

const stepMeta: StepMeta[] = stepMessageKeys.map((keys) => ({
  label: chrome.i18n.getMessage(keys.label),
  title: chrome.i18n.getMessage(keys.title),
  subtitle: chrome.i18n.getMessage(keys.subtitle),
}))

const data = reactive(new WizardData())
const currentIndex = ref(0)
const currentStep = computed(() => stepMeta[currentIndex.value])

/** Returns the i18n key of the error blocking this step, or null if it's complete. */
function validateBasics(): string | null {
  const complete = data.name.trim() !== '' && data.description.trim() !== ''
  return complete ? null : 'wizardBasicsRequiredError'
}

function validateScope(): string | null {
  if (data.scope !== 'domain') return null
  return data.scopeTargets.trim() !== '' ? null : 'wizardScopeRequiredError'
}

// One validator per slide; steps without a requirement always pass.
const stepValidators: Array<() => string | null> = [validateBasics, () => null, validateScope, () => null]

const toast = useToast()

/** The user can jump to any step at will, unless the current one is incomplete. */
function goTo(index: number): void {
  const errorKey = stepValidators[currentIndex.value]()
  if (index !== currentIndex.value && errorKey) {
    toast.error(chrome.i18n.getMessage(errorKey))
    return
  }
  currentIndex.value = index
}
</script>

<template>
  <div :class="ui.wizardWrapper">
    <div :class="ui.wizardHeader">
      <h1 :class="ui.wizardTitle">{{ currentStep.title }}</h1>
      <p :class="ui.wizardSubtitle">{{ currentStep.subtitle }}</p>
    </div>

    <div :class="ui.wizardBody">
      <WizardStepBasics v-if="currentIndex === 0" v-model:data="data" />
      <WizardStepTiming v-else-if="currentIndex === 1" v-model:data="data" />
      <WizardStepScope v-else-if="currentIndex === 2" v-model:data="data" />
      <WizardStepPlaceholder v-else />
    </div>

    <div :class="ui.wizardSteps">
      <button
        v-for="(step, index) in stepMeta"
        :key="step.label"
        type="button"
        :class="[ui.wizardStepDot, index === currentIndex && ui.wizardStepDotActive]"
        :aria-label="step.label"
        @click="goTo(index)"
      />
    </div>
  </div>
</template>
