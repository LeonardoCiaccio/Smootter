<script setup lang="ts">
import { ui } from '@/styles/ui'
import type { WizardData, WizardTrigger } from './WizardData'

const data = defineModel<WizardData>('data', { required: true })

interface TriggerOptionKeys {
  value: WizardTrigger
  titleKey: string
  descriptionKey: string
}

const optionKeys: TriggerOptionKeys[] = [
  {
    value: 'manual',
    titleKey: 'wizardTriggerManualTitle',
    descriptionKey: 'wizardTriggerManualDescription',
  },
  {
    value: 'pageStart',
    titleKey: 'wizardTriggerStartTitle',
    descriptionKey: 'wizardTriggerStartDescription',
  },
  {
    value: 'pageIdle',
    titleKey: 'wizardTriggerIdleTitle',
    descriptionKey: 'wizardTriggerIdleDescription',
  },
]

const options = optionKeys.map((option) => ({
  value: option.value,
  title: chrome.i18n.getMessage(option.titleKey),
  description: chrome.i18n.getMessage(option.descriptionKey),
}))

function select(value: WizardTrigger): void {
  data.value.trigger = value
}
</script>

<template>
  <div :class="ui.wizardStepBody">
    <div role="radiogroup" :class="ui.wizardOptionList">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        role="radio"
        :aria-checked="data.trigger === option.value"
        :class="[ui.wizardOption, data.trigger === option.value && ui.wizardOptionSelected]"
        @click="select(option.value)"
      >
        <span
          :class="[
            ui.wizardOptionRadio,
            data.trigger === option.value && ui.wizardOptionRadioSelected,
          ]"
        >
          <span v-if="data.trigger === option.value" :class="ui.wizardOptionRadioDot" />
        </span>
        <span :class="ui.wizardOptionText">
          <span :class="ui.wizardOptionTitle">{{ option.title }}</span>
          <span :class="ui.wizardOptionDescription">{{ option.description }}</span>
        </span>
      </button>
    </div>
  </div>
</template>
