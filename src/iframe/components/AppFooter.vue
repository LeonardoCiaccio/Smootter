<script setup lang="ts">
import { ui } from '@/styles/ui'

const manifest = chrome.runtime.getManifest()
const text = `© ${new Date().getFullYear()} ${manifest.name}`
</script>

<template>
  <div :class="ui.footer">{{ text }}</div>
</template>
