/**
 * toolsRefresh lets AppToolbar (always mounted) tell ToolsPanel (Home only)
 * that the tool list changed, without a full page reload.
 */
import { ref } from 'vue'

export const toolsRefreshSignal = ref(0)

export function notifyToolsChanged(): void {
  toolsRefreshSignal.value++
}
