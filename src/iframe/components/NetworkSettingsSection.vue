<script setup lang="ts">
import { inject, onMounted, reactive, ref } from 'vue'
import { ui } from '@/styles/ui'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { DEFAULT_NETWORK_CONFIG, type NetworkConfig } from '@/shared/preferences'
import { useToast } from '../plugins/toast'

const channel = inject(channelKey)
const toast = useToast()

const form = reactive<NetworkConfig>({ ...DEFAULT_NETWORK_CONFIG })
const saving = ref(false)

onMounted(async () => {
  const response = await channel?.send({ type: 'getPreference', key: 'networkConfig' })
  if (response?.type === 'preferenceValue' && response.key === 'networkConfig' && response.value) {
    Object.assign(form, response.value)
  }
})

async function save(): Promise<void> {
  if (!channel) return
  saving.value = true
  // An emptied number input leaves v-model.number holding '' (not 0) — never send that through.
  const minSizeBytes = Number.isFinite(form.minSizeBytes) && form.minSizeBytes >= 0 ? Math.floor(form.minSizeBytes) : 0
  form.minSizeBytes = minSizeBytes
  await channel.send({ type: 'setPreference', key: 'networkConfig', value: { minSizeBytes } })
  saving.value = false
  toast.success(chrome.i18n.getMessage('networkConfigSaved'))
}

const sectionTitle = chrome.i18n.getMessage('networkGroupTitle')
const sectionDescription = chrome.i18n.getMessage('networkSettingsDescription')
const minSizeLabel = chrome.i18n.getMessage('networkMinSizeLabel')
const saveLabel = chrome.i18n.getMessage('wizardSave')
</script>

<template>
  <div :class="ui.optionsSection">
    <div>
      <p :class="ui.optionsSectionTitle">{{ sectionTitle }}</p>
      <p :class="ui.optionsSectionDescription">{{ sectionDescription }}</p>
    </div>

    <label :class="ui.wizardField">
      <span :class="ui.wizardFieldLabel">{{ minSizeLabel }}</span>
      <input v-model.number="form.minSizeBytes" type="number" min="0" :class="ui.input" />
    </label>

    <div :class="ui.optionsSectionActions">
      <div />
      <button type="button" :class="ui.primaryButton" :disabled="saving" @click="save">{{ saveLabel }}</button>
    </div>
  </div>
</template>
