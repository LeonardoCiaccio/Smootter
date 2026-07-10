<script setup lang="ts">
import { ui } from '@/styles/ui'
import type { WizardData } from './WizardData'
import CodeEditor from './CodeEditor.vue'

const data = defineModel<WizardData>('data', { required: true })

/** Any edit invalidates a previous test — must be tested again before saving. */
function onCodeChange(value: string): void {
  data.value.code = value
  if (data.value.codeTested) data.value.codeTested = false
}
</script>

<template>
  <div :class="ui.wizardStepBodyFill">
    <CodeEditor :model-value="data.code" @update:model-value="onCodeChange" />
  </div>
</template>
