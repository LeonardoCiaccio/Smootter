<script setup lang="ts">
import { ui } from '@/styles/ui'
import ToolsPanel from '../components/ToolsPanel.vue'
import UserScriptsBanner from '../components/UserScriptsBanner.vue'

const headerText = chrome.i18n.getMessage('homeHeader')
const subheaderText = chrome.i18n.getMessage('homeSubheader')
</script>

<template>
  <div :class="ui.heroWrapper">
    <h1 :class="ui.heroHeader">{{ headerText }}</h1>
    <p :class="ui.heroSubheader">{{ subheaderText }}</p>
  </div>
  <UserScriptsBanner />
  <ToolsPanel />
</template>
