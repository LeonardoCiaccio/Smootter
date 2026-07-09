<script setup lang="ts">
import { ui } from '@/styles/ui'
import Breadcrumb from '../components/Breadcrumb.vue'

defineProps<{ viewKey: string }>()
</script>

<template>
  <div :class="ui.viewShell">
    <Breadcrumb :view-key="viewKey" />
    <div :class="ui.viewContent">
      <p :class="ui.statusText">Hello World</p>
    </div>
  </div>
</template>
