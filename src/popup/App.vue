<script setup lang="ts">
import { ui } from '@/styles/ui'
import { SparklesIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <main class="p-4">
    <div :class="ui.card">
      <div class="flex items-center gap-2">
        <SparklesIcon class="h-5 w-5 text-brand" />
        <h1 class="text-base font-semibold text-gray-900">Pippo</h1>
      </div>
      <p class="mt-2 text-sm text-gray-600">Fabbrica di tool nel browser.</p>
    </div>
  </main>
</template>
