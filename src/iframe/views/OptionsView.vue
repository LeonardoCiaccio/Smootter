<script setup lang="ts">
import { ui } from '@/styles/ui'
import Breadcrumb from '../components/Breadcrumb.vue'
import LlmSettingsSection from '../components/LlmSettingsSection.vue'
import CreditsSection from '../components/CreditsSection.vue'
</script>

<template>
  <div :class="ui.viewShell">
    <Breadcrumb view-key="options" />
    <div :class="ui.optionsContent">
      <LlmSettingsSection />
      <div :class="ui.optionsDivider" />
      <CreditsSection />
    </div>
  </div>
</template>
