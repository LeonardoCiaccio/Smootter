<script setup lang="ts">
import { computed } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { useTheme } from '@/shared/vuePlugins/theme'
import emptyStateSvgRaw from '@/assets/empty-state.svg?raw'

const label = chrome.i18n.getMessage('createFirstTool')

const { theme } = useTheme()
// Drop the fixed pixel size so the viewBox scales it via CSS instead (see :deep(svg) below).
const baseSvg = emptyStateSvgRaw.replace(' width="963" height="710.177"', '')
// The illustration's "screen" background (#f8f8f8) is drawn for a light page on dark theme it's turned off instead.
const illustrationMarkup = computed(() =>
  theme.value === 'dark' ? baseSvg.replaceAll('fill="#f8f8f8"', 'fill="transparent"') : baseSvg,
)
</script>

<template>
  <div :class="ui.toolsEmptyWrapper">
    <div class="illustration" :class="ui.toolsEmptyIllustration" v-html="illustrationMarkup" />
    <RouterLink to="/builder" :class="ui.toolsEmptyButton">
      <PlusIcon :class="ui.toolsEmptyIcon" />
      <span>{{ label }}</span>
    </RouterLink>
  </div>
</template>

<style scoped>
.illustration :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
