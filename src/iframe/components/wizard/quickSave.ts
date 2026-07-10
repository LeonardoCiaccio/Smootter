import type { InjectionKey, Ref } from 'vue'

/** Lets Wizard.vue drive a "quick save" button rendered by its parent view, next to the breadcrumb. */
export interface QuickSaveController {
  visible: boolean
  label: string
  save: () => void | Promise<void>
}

export const quickSaveKey: InjectionKey<Ref<QuickSaveController | null>> = Symbol('quickSave')
