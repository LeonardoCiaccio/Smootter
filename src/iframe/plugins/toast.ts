/**
 * toast Vue plugin exposing a global notification queue (info/success/warning/error).
 * Module-level singleton state, exposed via useToast() to any component.
 */
import { reactive } from 'vue'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface ToastItem {
  id: number
  type: ToastType
  message: string
}

const DEFAULT_DURATION_MS = 4000

const toasts = reactive<ToastItem[]>([])
let nextId = 0

function dismiss(id: number): void {
  const index = toasts.findIndex((item) => item.id === id)
  if (index !== -1) toasts.splice(index, 1)
}

function push(type: ToastType, message: string): void {
  const id = nextId++
  toasts.push({ id, type, message })
  setTimeout(() => dismiss(id), DEFAULT_DURATION_MS)
}

export function useToast() {
  return {
    toasts,
    dismiss,
    info: (message: string) => push('info', message),
    success: (message: string) => push('success', message),
    warning: (message: string) => push('warning', message),
    error: (message: string) => push('error', message),
  }
}

export const toast = {
  install(): void {
    // Module-level singleton state; install() only exists for consistency
    // with the project's "structural logic = Vue plugin" convention.
  },
}
