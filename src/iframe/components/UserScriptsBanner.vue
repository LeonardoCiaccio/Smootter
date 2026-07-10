<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { channelKey } from '@/shared/vuePlugins/messaging'

const channel = inject(channelKey)
// Assume enabled until the worker replies, to avoid a flash on the happy path.
const enabled = ref(true)

onMounted(() => {
  if (!channel) return
  channel.subscribe((message) => {
    if (message.type === 'userScriptsStatus') enabled.value = message.enabled
  })
  channel.send({ type: 'getUserScriptsStatus' })
})

const title = chrome.i18n.getMessage('userScriptsDisabledTitle')
const description = chrome.i18n.getMessage('userScriptsDisabledDescription')
</script>

<template>
  <div v-if="!enabled" :class="ui.banner">
    <ExclamationTriangleIcon :class="ui.bannerIcon" />
    <div :class="ui.bannerText">
      <p :class="ui.bannerTitle">{{ title }}</p>
      <p :class="ui.bannerDescription">{{ description }}</p>
    </div>
  </div>
</template>
