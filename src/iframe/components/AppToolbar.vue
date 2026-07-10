<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { Cog6ToothIcon, MoonIcon, SunIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { useTheme } from '@/shared/vuePlugins/theme'

const manifest = chrome.runtime.getManifest()
const appName = manifest.name
const appVersion = 'v' + manifest.version
const logoUrl = chrome.runtime.getURL('icons/icon-32.png')

const channel = inject(channelKey)
const topMessage = ref('')

onMounted(() => {
  if (!channel) return
  channel.subscribe((message) => {
    if (message.type === 'topMessage') topMessage.value = message.value
  })
  channel.send({ type: 'getTopMessage' })
})

const { theme, toggle } = useTheme()
const ThemeIcon = computed(() => (theme.value === 'dark' ? SunIcon : MoonIcon))

function closeModal(): void {
  channel?.send({ type: 'closeModal' })
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
      <button type="button" :class="ui.toolbarIconButton" @click="toggle">
        <component :is="ThemeIcon" :class="ui.toolbarIcon" />
      </button>
      <RouterLink to="/options" :class="ui.toolbarIconButton">
        <Cog6ToothIcon :class="ui.toolbarIcon" />
      </RouterLink>
      <button type="button" :class="ui.toolbarCloseButton" @click="closeModal">
        <XMarkIcon :class="ui.toolbarIcon" />
      </button>
    </div>
  </div>
</template>
