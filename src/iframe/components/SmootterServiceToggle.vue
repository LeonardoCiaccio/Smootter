<script setup lang="ts">
import { ui } from '@/styles/ui'

defineProps<{
  label: string
  description: string
  checked: boolean
}>()
const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <div :class="ui.smootterServiceRow">
    <div :class="ui.smootterServiceInfo">
      <span :class="ui.smootterServiceLabel">{{ label }}</span>
      <span :class="ui.smootterServiceDescription">{{ description }}</span>
    </div>
    <button
      type="button"
      role="switch"
      :aria-checked="checked"
      :class="[ui.switchTrack, checked ? ui.switchTrackOn : ui.switchTrackOff]"
      @click="emit('toggle')"
    >
      <span :class="[ui.switchThumb, checked && ui.switchThumbOn]" />
    </button>
  </div>
</template>
