<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ui } from '@/styles/ui'
import { WizardData } from './WizardData'
import WizardStepBasics from './WizardStepBasics.vue'
import WizardStepTiming from './WizardStepTiming.vue'
import WizardStepScope from './WizardStepScope.vue'
import WizardStepChat from './WizardStepChat.vue'
import { useToast } from '../../plugins/toast'
import { getTool } from '@/shared/toolsDb'

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

// Domain or domain/path, with an optional http(s):// scheme and an optional
// "*." wildcard subdomain prefix.
const DOMAIN_PATTERN =
  /^(https?:\/\/)?(\*\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?:\/\S*)?$/

const route = useRoute()

/** If opened via "edit a saved tool", load its data into the wizard. */
onMounted(async () => {
  const editId = route.query.edit
  if (typeof editId !== 'string') return

  const tool = await getTool(editId)
  if (!tool) return

  data.id = tool.id
  data.createdAt = tool.createdAt
  data.name = tool.name
  data.description = tool.description
  data.trigger = tool.trigger
  data.scope = tool.scope
  data.scopeTargets = tool.scopeTargets
  data.code = tool.code
  // The code was valid when it was saved; only a further edit invalidates it.
  data.codeTested = true
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

// One validator per slide; steps without a requirement always pass.
const stepValidators: Array<() => string | null> = [validateBasics, () => null, validateScope, () => null]

const toast = useToast()

/** The user can jump to any step at will, unless the current one is incomplete. */
function goTo(index: number): void {
  const error = stepValidators[currentIndex.value]()
  if (index !== currentIndex.value && error) {
    toast.error(error)
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
      <WizardStepChat v-else v-model:data="data" />
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
