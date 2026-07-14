<script setup lang="ts">
import { inject, onMounted, onUnmounted, reactive } from 'vue'
import { ui } from '@/styles/ui'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { DEFAULT_SMOOTTER_SERVICES, preferenceStorageKey, type SmootterServicesConfig } from '@/shared/preferences'

const channel = inject(channelKey)

const config = reactive<SmootterServicesConfig>({ ...DEFAULT_SMOOTTER_SERVICES })

onMounted(async () => {
  const response = await channel?.send({ type: 'getPreference', key: 'smootterServices' })
  if (response?.type === 'preferenceValue' && response.key === 'smootterServices' && response.value) {
    Object.assign(config, response.value)
  }
})

// Keeps this live if the preference changes elsewhere same reasoning as NetworkSettingsSection.
const smootterServicesKey = preferenceStorageKey('smootterServices')
function onStorageChanged(changes: Record<string, chrome.storage.StorageChange>, area: chrome.storage.AreaName): void {
  if (area !== 'local' || !(smootterServicesKey in changes)) return
  const newValue = changes[smootterServicesKey].newValue as SmootterServicesConfig | undefined
  if (newValue) Object.assign(config, newValue)
}
onMounted(() => chrome.storage.onChanged.addListener(onStorageChanged))
onUnmounted(() => chrome.storage.onChanged.removeListener(onStorageChanged))

// Saved immediately on toggle no separate Save button: each of these is a single on/off switch,
// not a form with several fields to review together (see NetworkSettingsSection for that pattern).
async function onToggleResumer(): Promise<void> {
  if (!channel) return
  config.resumer = !config.resumer
  await channel.send({ type: 'setPreference', key: 'smootterServices', value: { ...config } })
}

const sectionTitle = chrome.i18n.getMessage('smootterServicesGroupTitle')
const sectionDescription = chrome.i18n.getMessage('smootterServicesDescription')
const resumerLabel = chrome.i18n.getMessage('resumerServiceLabel')
const resumerDescription = chrome.i18n.getMessage('resumerServiceDescription')
</script>

<template>
  <div :class="ui.optionsSection">
    <div>
      <p :class="ui.optionsSectionTitle">{{ sectionTitle }}</p>
      <p :class="ui.optionsSectionDescription">{{ sectionDescription }}</p>
    </div>

    <div :class="ui.smootterServiceRow">
      <div :class="ui.smootterServiceInfo">
        <span :class="ui.smootterServiceLabel">{{ resumerLabel }}</span>
        <span :class="ui.smootterServiceDescription">{{ resumerDescription }}</span>
      </div>
      <button
        type="button"
        role="switch"
        :aria-checked="config.resumer"
        :class="[ui.switchTrack, config.resumer ? ui.switchTrackOn : ui.switchTrackOff]"
        @click="onToggleResumer"
      >
        <span :class="[ui.switchThumb, config.resumer && ui.switchThumbOn]" />
      </button>
    </div>
  </div>
</template>
