<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import ToolsPanel from '../components/ToolsPanel.vue'
import UserScriptsBanner from '../components/UserScriptsBanner.vue'
import { useToast } from '../plugins/toast'
import { importEverythingFromFiles } from '@/shared/exportImport'
import { notifyToolsChanged } from '../composables/toolsRefresh'
import { notifyBookmarkletsChanged } from '../composables/bookmarkletsRefresh'
import { showLlmApiKeyReminder } from '../composables/llmApiKeyReminder'

const headerText = chrome.i18n.getMessage('homeHeader')
const subheaderText = chrome.i18n.getMessage('homeSubheader')
const dropHintText = chrome.i18n.getMessage('toolsDropHint')

const toast = useToast()

// dragenter/dragleave both bubble from children, so a plain boolean flickers as the
// pointer crosses child elements — a counter nets that out to "are we still inside".
const dragDepth = ref(0)
const isDraggingFiles = computed(() => dragDepth.value > 0)

function onDragEnter(event: DragEvent): void {
  if (!event.dataTransfer?.types.includes('Files')) return
  dragDepth.value++
}

function onDragLeave(): void {
  dragDepth.value = Math.max(0, dragDepth.value - 1)
}

async function onDrop(event: DragEvent): Promise<void> {
  dragDepth.value = 0
  const files = Array.from(event.dataTransfer?.files ?? [])
  if (files.length === 0) return

  const { toolsImported, bookmarkletsImported, llmConfigNeedsApiKey, failed } = await importEverythingFromFiles(files)
  if (toolsImported > 0) notifyToolsChanged()
  if (bookmarkletsImported > 0) notifyBookmarkletsChanged()
  const imported = toolsImported + bookmarkletsImported
  if (imported > 0) toast.success(chrome.i18n.getMessage('toolsImportSuccess', [String(imported)]))
  if (failed > 0) toast.error(chrome.i18n.getMessage('toolsImportError'))
  if (llmConfigNeedsApiKey) showLlmApiKeyReminder()
}
</script>

<template>
  <div
    :class="ui.homeShell"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <div :class="ui.heroWrapper">
      <h1 :class="ui.heroHeader">{{ headerText }}</h1>
      <p :class="ui.heroSubheader">{{ subheaderText }}</p>
    </div>
    <UserScriptsBanner />
    <ToolsPanel />

    <div v-if="isDraggingFiles" :class="ui.toolsDropOverlay">
      <ArrowDownTrayIcon :class="ui.toolsDropOverlayIcon" />
      <p :class="ui.toolsDropOverlayText">{{ dropHintText }}</p>
    </div>
  </div>
</template>
