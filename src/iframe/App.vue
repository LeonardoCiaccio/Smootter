<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import AppToolbar from './components/AppToolbar.vue'
import AppFooter from './components/AppFooter.vue'
import ToastContainer from './components/ToastContainer.vue'
import LlmApiKeyReminderModal from './components/LlmApiKeyReminderModal.vue'
import ImportConfirmModal from './components/ImportConfirmModal.vue'
import { startImport } from './composables/importFlow'

const dropHintText = chrome.i18n.getMessage('toolsDropHint')

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
  await startImport(files)
}
</script>

<template>
  <div
    :class="ui.appShell"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <div :class="ui.heroGlow">
      <div :class="ui.heroGlowBlobA" />
      <div :class="ui.heroGlowBlobB" />
      <div :class="ui.heroGlowBlobC" />
    </div>
    <ToastContainer />
    <LlmApiKeyReminderModal />
    <ImportConfirmModal />
    <AppToolbar />
    <div :class="ui.layoutRoot">
      <div :class="ui.layoutSide" />
      <div :class="ui.layoutCenter">
        <router-view v-slot="{ Component, route }">
          <Transition name="view">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </router-view>
      </div>
      <div :class="ui.layoutSide" />
    </div>
    <AppFooter />

    <div v-if="isDraggingFiles" :class="ui.toolsDropOverlay">
      <ArrowDownTrayIcon :class="ui.toolsDropOverlayIcon" />
      <p :class="ui.toolsDropOverlayText">{{ dropHintText }}</p>
    </div>
  </div>
</template>
