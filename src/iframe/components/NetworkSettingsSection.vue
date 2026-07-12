<script setup lang="ts">
import { inject, onMounted, reactive, ref } from 'vue'
import { ui } from '@/styles/ui'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { DEFAULT_NETWORK_CONFIG, type NetworkConfig } from '@/shared/preferences'
import { useToast } from '../plugins/toast'

const channel = inject(channelKey)
const toast = useToast()

const form = reactive<NetworkConfig>({ ...DEFAULT_NETWORK_CONFIG })
// The textarea is the editable surface — one mimetype (or substring) per line.
const blockedMimeTypesText = ref('')
const saving = ref(false)

onMounted(async () => {
  const response = await channel?.send({ type: 'getPreference', key: 'networkConfig' })
  if (response?.type === 'preferenceValue' && response.key === 'networkConfig' && response.value) {
    Object.assign(form, response.value)
    blockedMimeTypesText.value = response.value.blockedMimeTypes.join('\n')
  }
})

async function save(): Promise<void> {
  if (!channel) return
  saving.value = true
  const blockedMimeTypes = blockedMimeTypesText.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
  await channel.send({ type: 'setPreference', key: 'networkConfig', value: { ...form, blockedMimeTypes } })
  saving.value = false
  toast.success(chrome.i18n.getMessage('networkConfigSaved'))
}

const sectionTitle = chrome.i18n.getMessage('networkGroupTitle')
const sectionDescription = chrome.i18n.getMessage('networkSettingsDescription')
const minSizeLabel = chrome.i18n.getMessage('networkMinSizeLabel')
const blockedMimeTypesLabel = chrome.i18n.getMessage('networkBlockedMimeTypesLabel')
const blockedMimeTypesPlaceholder = chrome.i18n.getMessage('networkBlockedMimeTypesPlaceholder')
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

    <label :class="ui.wizardField">
      <span :class="ui.wizardFieldLabel">{{ blockedMimeTypesLabel }}</span>
      <textarea
        v-model="blockedMimeTypesText"
        rows="4"
        :class="ui.input"
        :placeholder="blockedMimeTypesPlaceholder"
      />
    </label>

    <div :class="ui.optionsSectionActions">
      <div />
      <button type="button" :class="ui.primaryButton" :disabled="saving" @click="save">{{ saveLabel }}</button>
    </div>
  </div>
</template>
