<script setup lang="ts">
import { ui } from '@/styles/ui'

interface CreditEntry {
  name: string
  version: string
}

// Kept in sync by hand with package.json's dependencies.
const CREDITS: CreditEntry[] = [
  { name: 'Vue', version: '3.5.39' },
  { name: 'Vue Router', version: '5.1.0' },
  { name: 'Tailwind CSS', version: '3.4.19' },
  { name: 'Heroicons', version: '2.2.0' },
  { name: 'CodeMirror', version: '6.0.2' },
  { name: 'Acorn', version: '8.17.0' },
  { name: 'canvas-confetti', version: '1.9.4' },
  { name: 'GRIP', version: '1.173.0' },
]

const sectionTitle = chrome.i18n.getMessage('creditsTitle')
const sectionDescription = chrome.i18n.getMessage('creditsDescription')
</script>

<template>
  <div :class="ui.optionsSection">
    <div>
      <p :class="ui.optionsSectionTitle">{{ sectionTitle }}</p>
      <p :class="ui.optionsSectionDescription">{{ sectionDescription }}</p>
    </div>

    <ul :class="ui.creditsList">
      <li v-for="credit in CREDITS" :key="credit.name" :class="ui.creditsItem">
        <span>{{ credit.name }}</span>
        <span :class="ui.creditsVersion">v{{ credit.version }}</span>
      </li>
    </ul>
  </div>
</template>
