<script setup lang="ts">
import { ref } from 'vue'
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { useToast } from '../plugins/toast'
import { deleteTool, type StoredTool } from '@/shared/toolsDb'

const props = defineProps<{ tool: StoredTool }>()
const emit = defineEmits<{ deleted: [id: string] }>()

const toast = useToast()

const editLabel = chrome.i18n.getMessage('toolEdit')
const deleteLabel = chrome.i18n.getMessage('toolDelete')
const deleteConfirmLabel = chrome.i18n.getMessage('toolDeleteConfirm')

const createdLabel = chrome.i18n.getMessage('toolCardCreated')
const updatedLabel = chrome.i18n.getMessage('toolCardUpdated')
const createdAtDate = new Date(props.tool.createdAt).toLocaleDateString()
const updatedAtDate = new Date(props.tool.updatedAt).toLocaleDateString()
const metaText = `${createdLabel} ${createdAtDate} · ${updatedLabel} ${updatedAtDate}`

// Delete needs two clicks: the first arms it (auto-disarms after a few
// seconds), the second actually deletes.
const confirmingDelete = ref(false)
let disarmTimer: ReturnType<typeof setTimeout> | undefined

async function onDeleteClick(): Promise<void> {
  if (!confirmingDelete.value) {
    confirmingDelete.value = true
    disarmTimer = setTimeout(() => (confirmingDelete.value = false), 3000)
    return
  }

  clearTimeout(disarmTimer)
  await deleteTool(props.tool.id)
  toast.success(chrome.i18n.getMessage('toolDeleted'))
  emit('deleted', props.tool.id)
}
</script>

<template>
  <div :class="ui.toolCard">
    <span :class="ui.toolCardTitle" :title="tool.name">{{ tool.name }}</span>
    <span :class="ui.toolCardDescription" :title="tool.description">{{ tool.description }}</span>
    <span :class="ui.toolCardMeta" :title="metaText">{{ metaText }}</span>

    <div :class="ui.toolCardActions">
      <RouterLink
        :to="{ path: '/builder', query: { edit: tool.id } }"
        :class="ui.toolCardActionButton"
        :title="editLabel"
      >
        <PencilIcon :class="ui.toolCardIcon" />
      </RouterLink>
      <button
        type="button"
        :class="confirmingDelete ? ui.toolCardDeleteConfirm : ui.toolCardActionButton"
        :title="confirmingDelete ? deleteConfirmLabel : deleteLabel"
        @click="onDeleteClick"
      >
        <TrashIcon :class="ui.toolCardIcon" />
      </button>
    </div>
  </div>
</template>
