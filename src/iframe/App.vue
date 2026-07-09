<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import { channelKey } from './plugins/messaging'
import { ui } from '@/styles/ui'

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
  <div :class="ui.layoutRoot">
    <div :class="ui.layoutSide" />
    <div :class="ui.layoutCenter">
      <div :class="ui.pageContent">
        <p :class="ui.statusText">{{ status }}</p>
      </div>
    </div>
    <div :class="ui.layoutSide" />
  </div>
</template>
