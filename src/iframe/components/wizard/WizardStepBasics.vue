<script setup lang="ts">
import { ui } from '@/styles/ui'
import type { WizardData } from './WizardData'

const data = defineModel<WizardData>('data', { required: true })

const maxDescriptionLength = 120

const nameLabel = chrome.i18n.getMessage('wizardNameLabel')
const namePlaceholder = chrome.i18n.getMessage('wizardNamePlaceholder')
const descriptionLabel = chrome.i18n.getMessage('wizardDescriptionLabel')
const descriptionPlaceholder = chrome.i18n.getMessage('wizardDescriptionPlaceholder')
</script>

<template>
  <div :class="ui.wizardStepBody">
    <label :class="ui.wizardField">
      <span :class="ui.wizardFieldLabel">{{ nameLabel }}</span>
      <input v-model="data.name" type="text" :class="ui.input" :placeholder="namePlaceholder" />
    </label>
    <label :class="ui.wizardField">
      <span :class="ui.wizardFieldLabel">{{ descriptionLabel }}</span>
      <textarea
        v-model="data.description"
        :maxlength="maxDescriptionLength"
        rows="3"
        :class="ui.input"
        :placeholder="descriptionPlaceholder"
      />
      <span :class="ui.wizardCounter">{{ data.description.length }}/{{ maxDescriptionLength }}</span>
    </label>
  </div>
</template>
