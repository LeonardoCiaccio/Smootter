<script setup lang="ts">
import { ref } from 'vue'
import { BookOpenIcon, CpuChipIcon, SignalIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import Breadcrumb from '../components/Breadcrumb.vue'
import LlmSettingsSection from '../components/LlmSettingsSection.vue'
import NetworkSettingsSection from '../components/NetworkSettingsSection.vue'
import CreditsSection from '../components/CreditsSection.vue'

type OptionsSection = 'llm' | 'network' | 'credits'

const sections = [
  { key: 'llm' as const, label: chrome.i18n.getMessage('llmGroupTitle'), icon: CpuChipIcon },
  { key: 'network' as const, label: chrome.i18n.getMessage('networkGroupTitle'), icon: SignalIcon },
  { key: 'credits' as const, label: chrome.i18n.getMessage('creditsTitle'), icon: BookOpenIcon },
]

const selected = ref<OptionsSection>('llm')
</script>

<template>
  <div :class="ui.viewShell">
    <Breadcrumb view-key="options" />

    <div :class="ui.optionsLayout">
      <div :class="ui.optionsSidebar">
        <button
          v-for="section in sections"
          :key="section.key"
          type="button"
          :class="[ui.optionsSidebarItem, selected === section.key && ui.optionsSidebarItemActive]"
          @click="selected = section.key"
        >
          <component :is="section.icon" :class="ui.optionsSidebarIcon" />
          <span>{{ section.label }}</span>
        </button>
      </div>

      <div :class="ui.optionsMain">
        <LlmSettingsSection v-if="selected === 'llm'" />
        <NetworkSettingsSection v-else-if="selected === 'network'" />
        <CreditsSection v-else />
      </div>
    </div>
  </div>
</template>
