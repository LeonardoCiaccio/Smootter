<script setup lang="ts">
import { computed } from 'vue'
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  CubeIcon,
  DocumentIcon,
  DocumentTextIcon,
  FilmIcon,
  MusicalNoteIcon,
  PhotoIcon,
} from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import type { NetworkEntry } from '@/shared/messages'
import { formatBytes } from '@/shared/bytes'
import { useToast } from '../plugins/toast'

const props = defineProps<{ entry: NetworkEntry }>()

const toast = useToast()
const copyLabel = chrome.i18n.getMessage('networkCopyUrl')
const openLabel = chrome.i18n.getMessage('networkOpenInNewTab')
const downloadLabel = chrome.i18n.getMessage('networkDownload')

const isImage = computed(() => props.entry.contentType.startsWith('image/'))

const RowIcon = computed(() => {
  const type = props.entry.contentType.toLowerCase()
  if (type.startsWith('video/')) return FilmIcon
  if (type.startsWith('audio/')) return MusicalNoteIcon
  if (type.startsWith('image/')) return PhotoIcon
  if (type === 'application/pdf') return DocumentTextIcon
  if (/msword|officedocument|rtf|text\/(plain|csv|html)/.test(type)) return DocumentIcon
  return CubeIcon
})

const statusClass = computed(() => {
  const status = props.entry.status
  if (status >= 200 && status < 300) return ui.networkRowStatusOk
  if (status >= 300 && status < 400) return ui.networkRowStatusRedirect
  return ui.networkRowStatusError
})

const formattedSize = computed(() => formatBytes(props.entry.size))
const formattedTime = computed(() => new Date(props.entry.timestamp).toLocaleTimeString())

async function onCopyUrl(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.entry.url)
    toast.success(chrome.i18n.getMessage('networkUrlCopied'))
  } catch {
    toast.error(chrome.i18n.getMessage('networkCopyUrlError'))
  }
}

async function onDownload(): Promise<void> {
  try {
    await chrome.downloads.download({ url: props.entry.url, saveAs: false })
  } catch {
    toast.error(chrome.i18n.getMessage('networkDownloadError'))
  }
}
</script>

<template>
  <div :class="ui.networkRow">
    <span :class="ui.networkRowThumb">
      <img v-if="isImage" :src="entry.url" :class="ui.networkRowThumbImage" alt="" />
      <component :is="RowIcon" v-else :class="ui.networkRowThumbIcon" />
    </span>

    <div :class="ui.networkRowBody">
      <p :class="ui.networkRowUrl">{{ entry.url }}</p>
      <div :class="ui.networkRowMetaRow">
        <span :class="ui.networkRowMethod">{{ entry.method }}</span>
        <span :class="statusClass">{{ entry.status }}</span>
        <span>{{ entry.contentType }}</span>
        <span>{{ formattedSize }}</span>
        <span>{{ formattedTime }}</span>
      </div>
    </div>

    <div :class="ui.networkRowActions">
      <button type="button" :class="ui.networkRowActionButton" :title="copyLabel" @click="onCopyUrl">
        <ClipboardDocumentIcon :class="ui.networkRowActionIcon" />
      </button>
      <a :href="entry.url" target="_blank" rel="noopener noreferrer" :class="ui.networkRowActionButton" :title="openLabel">
        <ArrowTopRightOnSquareIcon :class="ui.networkRowActionIcon" />
      </a>
      <button type="button" :class="ui.networkRowActionButton" :title="downloadLabel" @click="onDownload">
        <ArrowDownTrayIcon :class="ui.networkRowActionIcon" />
      </button>
    </div>
  </div>
</template>
