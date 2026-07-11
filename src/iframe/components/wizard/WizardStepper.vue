<script setup lang="ts">
import { computed } from 'vue'
import { CheckIcon } from '@heroicons/vue/24/solid'
import { ui } from '@/styles/ui'

interface StepperStep {
  label: string
}

const props = defineProps<{ steps: StepperStep[]; currentIndex: number }>()
const emit = defineEmits<{ select: [index: number] }>()

// Progress line fills proportionally to how far along the steps we are.
const fillPercent = computed(() => {
  if (props.steps.length <= 1) return 0
  return (props.currentIndex / (props.steps.length - 1)) * 100
})
</script>

<template>
  <div :class="ui.wizardStepperWrapper">
    <div :class="ui.wizardStepperTrack" />
    <div
      :class="ui.wizardStepperTrackFill"
      :style="{ width: `calc((100% - 2rem) * ${fillPercent / 100})` }"
    />

    <button
      v-for="(step, index) in steps"
      :key="step.label"
      type="button"
      :class="ui.wizardStepperButton"
      @click="emit('select', index)"
    >
      <span
        :class="[
          ui.wizardStepperCircle,
          index < currentIndex
            ? ui.wizardStepperCircleDone
            : index === currentIndex
              ? ui.wizardStepperCircleActive
              : ui.wizardStepperCircleUpcoming,
        ]"
      >
        <CheckIcon v-if="index < currentIndex" :class="ui.wizardStepperCircleIcon" />
        <template v-else>{{ index + 1 }}</template>
      </span>
      <span
        :class="[ui.wizardStepperLabel, index === currentIndex ? ui.wizardStepperLabelActive : ui.wizardStepperLabelUpcoming]"
      >
        {{ step.label }}
      </span>
    </button>
  </div>
</template>
