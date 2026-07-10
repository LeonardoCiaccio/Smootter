<script setup lang="ts">
import { ui } from '@/styles/ui'
import type { WizardData, WizardScope } from './WizardData'

const data = defineModel<WizardData>('data', { required: true })

interface ScopeOptionKeys {
  value: WizardScope
  titleKey: string
  descriptionKey: string
}

const optionKeys: ScopeOptionKeys[] = [
  {
    value: 'everywhere',
    titleKey: 'wizardScopeEverywhereTitle',
    descriptionKey: 'wizardScopeEverywhereDescription',
  },
  {
    value: 'domain',
    titleKey: 'wizardScopeDomainTitle',
    descriptionKey: 'wizardScopeDomainDescription',
  },
]

const options = optionKeys.map((option) => ({
  value: option.value,
  title: chrome.i18n.getMessage(option.titleKey),
  description: chrome.i18n.getMessage(option.descriptionKey),
}))

const targetsPlaceholder = chrome.i18n.getMessage('wizardScopeTargetsPlaceholder')

function select(value: WizardScope): void {
  data.value.scope = value
}
</script>

<template>
  <div :class="ui.wizardStepBody">
    <div role="radiogroup" :class="ui.wizardOptionList">
      <template v-for="option in options" :key="option.value">
        <button
          type="button"
          role="radio"
          :aria-checked="data.scope === option.value"
          :class="[ui.wizardOption, data.scope === option.value && ui.wizardOptionSelected]"
          @click="select(option.value)"
        >
          <span
            :class="[
              ui.wizardOptionRadio,
              data.scope === option.value && ui.wizardOptionRadioSelected,
            ]"
          >
            <span v-if="data.scope === option.value" :class="ui.wizardOptionRadioDot" />
          </span>
          <span :class="ui.wizardOptionText">
            <span :class="ui.wizardOptionTitle">{{ option.title }}</span>
            <span :class="ui.wizardOptionDescription">{{ option.description }}</span>
          </span>
        </button>

        <textarea
          v-if="option.value === 'domain' && data.scope === 'domain'"
          v-model="data.scopeTargets"
          rows="3"
          :class="ui.input"
          :placeholder="targetsPlaceholder"
        />
      </template>
    </div>
  </div>
</template>
