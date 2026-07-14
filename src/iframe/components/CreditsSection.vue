<script setup lang="ts">
import { ui } from '@/styles/ui'

interface CreditEntry {
  name: string
  version: string
  url: string
}

// Kept in sync by hand with package.json's dependencies.
const CREDITS: CreditEntry[] = [
  { name: 'Vue', version: '3.5.39', url: 'https://vuejs.org' },
  { name: 'Vue Router', version: '5.1.0', url: 'https://router.vuejs.org' },
  { name: 'Tailwind CSS', version: '3.4.19', url: 'https://tailwindcss.com' },
  { name: 'Heroicons', version: '2.2.0', url: 'https://heroicons.com' },
  { name: 'CodeMirror', version: '6.0.2', url: 'https://codemirror.net' },
  { name: 'Acorn', version: '8.17.0', url: 'https://github.com/acornjs/acorn' },
  { name: 'canvas-confetti', version: '1.9.4', url: 'https://github.com/catdad/canvas-confetti' },
  { name: 'GRIP', version: '1.173.0', url: 'https://www.npmjs.com/package/@leonardo.ciaccio/grip' },
  { name: 'marked', version: '18.0.6', url: 'https://marked.js.org' },
  { name: 'DOMPurify', version: '3.4.12', url: 'https://github.com/cure53/DOMPurify' },
  { name: 'Tailwind Typography', version: '0.5.20', url: 'https://github.com/tailwindlabs/tailwindcss-typography' },
  { name: 'unDraw', version: '', url: 'https://undraw.co' },
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
        <a :href="credit.url" target="_blank" rel="noopener noreferrer" :class="ui.creditsLink">{{
          credit.name
        }}</a>
        <span v-if="credit.version" :class="ui.creditsVersion">v{{ credit.version }}</span>
      </li>
    </ul>
  </div>
</template>
