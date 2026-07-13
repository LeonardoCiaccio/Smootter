<script setup lang="ts">
import { FolderIcon, SignalIcon, WrenchScrewdriverIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'

const headerText = chrome.i18n.getMessage('homeHeader')
const subheaderText = chrome.i18n.getMessage('homeSubheader')

const cards = [
  {
    to: '/tools',
    icon: WrenchScrewdriverIcon,
    title: chrome.i18n.getMessage('homeToolsCardTitle'),
    description: chrome.i18n.getMessage('homeToolsCardDescription'),
  },
  {
    to: '/bookmarklets',
    icon: FolderIcon,
    title: chrome.i18n.getMessage('homeBookmarkletsCardTitle'),
    description: chrome.i18n.getMessage('homeBookmarkletsCardDescription'),
  },
  {
    to: '/network',
    icon: SignalIcon,
    title: chrome.i18n.getMessage('homeNetworkCardTitle'),
    description: chrome.i18n.getMessage('homeNetworkCardDescription'),
  },
]
</script>

<template>
  <div :class="ui.homeShell">
    <div :class="ui.heroWrapper">
      <h1 :class="ui.heroHeader">{{ headerText }}</h1>
      <p :class="ui.heroSubheader">{{ subheaderText }}</p>
    </div>

    <div :class="ui.homeCardsWrapper">
      <RouterLink v-for="card in cards" :key="card.to" :to="card.to" :class="ui.homeCard">
        <span :class="ui.homeCardIconWrapper">
          <component :is="card.icon" :class="ui.homeCardIcon" />
        </span>
        <span :class="ui.homeCardTitle">{{ card.title }}</span>
        <span :class="ui.homeCardDescription">{{ card.description }}</span>
      </RouterLink>
    </div>
  </div>
</template>
