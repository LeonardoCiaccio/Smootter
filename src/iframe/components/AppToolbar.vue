<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, Cog6ToothIcon, MoonIcon, SunIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { useTheme } from '@/shared/vuePlugins/theme'
import { useToast } from '../plugins/toast'
import { getAllTools } from '@/shared/toolsDb'
import { exportAllTools, importToolsFromFiles } from '@/shared/toolsTransfer'
import { notifyToolsChanged } from '../composables/toolsRefresh'

const manifest = chrome.runtime.getManifest()
const appName = manifest.name
const appVersion = 'v' + manifest.version
const logoUrl = chrome.runtime.getURL('icons/icon-32.png')

const channel = inject(channelKey)
const topMessage = ref('')

onMounted(async () => {
  if (!channel) return
  const response = await channel.send({ type: 'getTopMessage' })
  if (response.type === 'topMessage') topMessage.value = response.value
})

const { theme, toggle } = useTheme()
const ThemeIcon = computed(() => (theme.value === 'dark' ? SunIcon : MoonIcon))

function closeModal(): void {
  channel?.send({ type: 'closeModal' })
}

const toast = useToast()
const exportAllLabel = chrome.i18n.getMessage('toolbarExportAll')
const importLabel = chrome.i18n.getMessage('toolbarImport')

async function onExportAllClick(): Promise<void> {
  const tools = await getAllTools()
  exportAllTools(tools)
}

const importInput = ref<HTMLInputElement>()

function onImportClick(): void {
  importInput.value?.click()
}

async function onImportFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = '' // lets the same file be re-selected later
  if (files.length === 0) return

  const { imported, failed } = await importToolsFromFiles(files)
  if (imported > 0) {
    notifyToolsChanged()
    toast.success(chrome.i18n.getMessage('toolsImportSuccess', [String(imported)]))
  }
  if (failed > 0) toast.error(chrome.i18n.getMessage('toolsImportError'))
}
</script>

<template>
  <div :class="ui.toolbar">
    <div :class="ui.toolbarAppInfo">
      <img :src="logoUrl" :class="ui.toolbarLogo" alt="" />
      <span :class="ui.toolbarAppName">{{ appName }}</span>
      <span :class="ui.toolbarAppVersion">{{ appVersion }}</span>
    </div>

    <div v-if="topMessage" :class="ui.toolbarPill">
      <span :class="ui.toolbarPillDot" />
      <span :class="ui.toolbarPillText">{{ topMessage }}</span>
    </div>
    <div v-else />

    <div :class="ui.toolbarActions">
      <button type="button" :class="ui.toolbarIconButton" :title="exportAllLabel" @click="onExportAllClick">
        <ArrowUpTrayIcon :class="ui.toolbarIcon" />
      </button>
      <button type="button" :class="ui.toolbarIconButton" :title="importLabel" @click="onImportClick">
        <ArrowDownTrayIcon :class="ui.toolbarIcon" />
      </button>
      <input
        ref="importInput"
        type="file"
        accept=".json,application/json"
        multiple
        :class="ui.toolbarHiddenFileInput"
        @change="onImportFileChange"
      />

      <div :class="ui.toolbarDivider" />

      <button type="button" :class="ui.toolbarIconButton" @click="toggle">
        <component :is="ThemeIcon" :class="ui.toolbarIcon" />
      </button>
      <RouterLink to="/options" :class="ui.toolbarIconButton">
        <Cog6ToothIcon :class="ui.toolbarIcon" />
      </RouterLink>

      <div :class="ui.toolbarDivider" />

      <button type="button" :class="ui.toolbarCloseButton" @click="closeModal">
        <XMarkIcon :class="ui.toolbarIcon" />
      </button>
    </div>
  </div>
</template>
