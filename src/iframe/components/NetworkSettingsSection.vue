<script setup lang="ts">
import { inject, onMounted, reactive, ref } from 'vue'
import { ui } from '@/styles/ui'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { DEFAULT_NETWORK_CONFIG, type NetworkConfig } from '@/shared/preferences'
import { parseMimeCategories, serializeMimeCategories } from '@/shared/mimeCategories'
import { useToast } from '../plugins/toast'

const channel = inject(channelKey)
const toast = useToast()

const form = reactive<NetworkConfig>({ ...DEFAULT_NETWORK_CONFIG })
// Both textareas are the editable surface — parsed/serialized on load and save.
const blockedMimeTypesText = ref('')
const mimeCategoriesText = ref(serializeMimeCategories(DEFAULT_NETWORK_CONFIG.mimeCategories))
const saving = ref(false)

onMounted(async () => {
  const response = await channel?.send({ type: 'getPreference', key: 'networkConfig' })
  if (response?.type === 'preferenceValue' && response.key === 'networkConfig' && response.value) {
    Object.assign(form, response.value)
    blockedMimeTypesText.value = response.value.blockedMimeTypes.join('\n')
    mimeCategoriesText.value = serializeMimeCategories(response.value.mimeCategories)
  }
})

async function save(): Promise<void> {
  if (!channel) return
  saving.value = true
  const blockedMimeTypes = blockedMimeTypesText.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
  const mimeCategories = parseMimeCategories(mimeCategoriesText.value)
  // An emptied number input leaves v-model.number holding '' (not 0) — never send that through.
  const minSizeBytes = Number.isFinite(form.minSizeBytes) && form.minSizeBytes >= 0 ? Math.floor(form.minSizeBytes) : 0
  form.minSizeBytes = minSizeBytes
  await channel.send({ type: 'setPreference', key: 'networkConfig', value: { minSizeBytes, blockedMimeTypes, mimeCategories } })
  saving.value = false
  toast.success(chrome.i18n.getMessage('networkConfigSaved'))
}

const sectionTitle = chrome.i18n.getMessage('networkGroupTitle')
const sectionDescription = chrome.i18n.getMessage('networkSettingsDescription')
const minSizeLabel = chrome.i18n.getMessage('networkMinSizeLabel')
const blockedMimeTypesLabel = chrome.i18n.getMessage('networkBlockedMimeTypesLabel')
const blockedMimeTypesPlaceholder = chrome.i18n.getMessage('networkBlockedMimeTypesPlaceholder')
const mimeCategoriesLabel = chrome.i18n.getMessage('networkMimeCategoriesLabel')
const mimeCategoriesDescription = chrome.i18n.getMessage('networkMimeCategoriesDescription')
const mimeCategoriesPlaceholder = chrome.i18n.getMessage('networkMimeCategoriesPlaceholder')
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

    <label :class="ui.wizardField">
      <span :class="ui.wizardFieldLabel">{{ mimeCategoriesLabel }}</span>
      <span :class="ui.optionsSectionDescription">{{ mimeCategoriesDescription }}</span>
      <textarea
        v-model="mimeCategoriesText"
        rows="12"
        :class="[ui.input, ui.networkMimeCategoriesTextarea]"
        :placeholder="mimeCategoriesPlaceholder"
      />
    </label>

    <div :class="ui.optionsSectionActions">
      <div />
      <button type="button" :class="ui.primaryButton" :disabled="saving" @click="save">{{ saveLabel }}</button>
    </div>
  </div>
</template>
