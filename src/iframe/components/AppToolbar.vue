<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, Cog6ToothIcon, FolderIcon, MoonIcon, SunIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { useTheme } from '@/shared/vuePlugins/theme'
import { exportEverything } from '@/shared/exportImport'
import { startImport } from '../composables/importFlow'

const manifest = chrome.runtime.getManifest()
const appName = manifest.name
const appVersion = 'v' + manifest.version
const logoUrl = chrome.runtime.getURL('icons/icon-32.png')

const channel = inject(channelKey)
const bookmarkletsLabel = chrome.i18n.getMessage('bookmarklets')

const { theme, toggle } = useTheme()
const ThemeIcon = computed(() => (theme.value === 'dark' ? SunIcon : MoonIcon))

function closeModal(): void {
  channel?.send({ type: 'closeModal' })
}

const exportAllLabel = chrome.i18n.getMessage('toolbarExportAll')
const importLabel = chrome.i18n.getMessage('toolbarImport')

async function onExportAllClick(): Promise<void> {
  await exportEverything()
}

const importInput = ref<HTMLInputElement>()

function onImportClick(): void {
  importInput.value?.click()
}

async function onImportFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = '' // lets the same file be re-selected later
  await startImport(files)
}
</script>

<template>
  <div :class="ui.toolbar">
    <div :class="ui.toolbarAppInfo">
      <img :src="logoUrl" :class="ui.toolbarLogo" alt="" />
      <span :class="ui.toolbarAppName">{{ appName }}</span>
      <span :class="ui.toolbarAppVersion">{{ appVersion }}</span>
    </div>

    <div :class="ui.toolbarAccessories">
      <RouterLink to="/bookmarklets" :class="ui.toolbarAccessoryButton" :title="bookmarkletsLabel">
        <FolderIcon :class="ui.toolbarAccessoryIcon" />
      </RouterLink>
    </div>

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
