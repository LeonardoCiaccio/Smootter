<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import { channelKey } from './plugins/messaging'

const channel = inject(channelKey)
const status = ref('channel: …')

onMounted(() => {
  if (!channel) return
  channel.subscribe((message) => {
    if (message.type === 'pong') status.value = 'channel: pong ✓'
  })
  channel.send({ type: 'ping' })
})
</script>

<template>
  <div class="flex h-full items-center justify-center bg-white dark:bg-gray-900">
    <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ status }}</p>
  </div>
</template>
