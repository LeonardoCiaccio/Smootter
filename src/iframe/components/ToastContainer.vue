<script setup lang="ts">
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { useToast, type ToastType } from '../plugins/toast'

const { toasts } = useToast()

const icons: Record<ToastType, typeof InformationCircleIcon> = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
}

const variantClass: Record<ToastType, string> = {
  info: ui.toastInfo,
  success: ui.toastSuccess,
  warning: ui.toastWarning,
  error: ui.toastError,
}
</script>

<template>
  <div :class="ui.toastContainer">
    <TransitionGroup name="toast">
      <div v-for="item in toasts" :key="item.id" :class="[ui.toast, variantClass[item.type]]">
        <component :is="icons[item.type]" :class="ui.toastIcon" />
        <span>{{ item.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>
