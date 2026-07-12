<script setup lang="ts">
import { FolderIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import Breadcrumb from '../components/Breadcrumb.vue'

const comingSoonLabel = chrome.i18n.getMessage('comingSoon')
</script>

<template>
  <div :class="ui.viewShell">
    <Breadcrumb view-key="bookmarklets" />
    <div :class="ui.viewContent">
      <div :class="ui.addToolCard">
        <FolderIcon :class="ui.addToolCardIcon" />
        <span :class="ui.addToolCardLabel">{{ comingSoonLabel }}</span>
      </div>
    </div>
  </div>
</template>
