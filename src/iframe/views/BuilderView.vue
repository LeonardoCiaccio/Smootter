<script setup lang="ts">
import { ui } from '@/styles/ui'
import Breadcrumb from '../components/Breadcrumb.vue'
import Wizard from '../components/wizard/Wizard.vue'
</script>

<template>
  <div :class="ui.viewShell">
    <Breadcrumb view-key="builder" />
    <div :class="ui.wizardViewport">
      <Wizard />
    </div>
  </div>
</template>
