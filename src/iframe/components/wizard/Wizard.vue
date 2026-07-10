<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ui } from '@/styles/ui'
import { WizardData } from './WizardData'
import WizardStepBasics from './WizardStepBasics.vue'
import WizardStepTiming from './WizardStepTiming.vue'
import WizardStepScope from './WizardStepScope.vue'
import WizardStepPlaceholder from './WizardStepPlaceholder.vue'

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

/** The user can jump to any step at will, to revisit and edit freely. */
function goTo(index: number): void {
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
