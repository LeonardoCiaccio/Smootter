<script setup lang="ts">
import { provide, ref } from 'vue'
import { ui } from '@/styles/ui'
import Breadcrumb from '../components/Breadcrumb.vue'
import Wizard from '../components/wizard/Wizard.vue'
import { quickSaveKey, type QuickSaveController } from '../components/wizard/quickSave'

const quickSave = ref<QuickSaveController | null>(null)
provide(quickSaveKey, quickSave)
</script>

<template>
  <div :class="ui.viewShell">
    <Breadcrumb view-key="builder">
      <template v-if="quickSave?.visible">
        <span :class="ui.breadcrumbSeparator">/</span>
        <button type="button" :class="ui.breadcrumbSaveAction" @click="quickSave.save">
          {{ quickSave.label }}
        </button>
      </template>
    </Breadcrumb>
    <div :class="ui.wizardViewport">
      <Wizard />
    </div>
  </div>
</template>
