/**
 * replacerRefresh lets AppToolbar/HomeView (import can happen from either) tell ReplacerView
 * the data changed, without a full page reload. Mirrors bookmarkletsRefresh.ts.
 */
import { ref } from 'vue'

export const replacerRefreshSignal = ref(0)

export function notifyReplacerChanged(): void {
  replacerRefreshSignal.value++
}
