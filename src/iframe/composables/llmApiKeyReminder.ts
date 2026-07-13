/**
 * llmApiKeyReminder module-level singleton (same pattern as toast.ts) so an import
 * triggered from AppToolbar or HomeView can pop this modal, always mounted once in App.vue.
 */
import { ref } from 'vue'

export const llmApiKeyReminderVisible = ref(false)

export function showLlmApiKeyReminder(): void {
  llmApiKeyReminderVisible.value = true
}
