<script setup lang="ts">
import { ui } from '@/styles/ui'

const label = chrome.i18n.getMessage('wizardPlaceholder')
</script>

<template>
  <div :class="ui.wizardStepBody">
    <p :class="ui.statusText">{{ label }}</p>
  </div>
</template>
