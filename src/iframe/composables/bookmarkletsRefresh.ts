/**
 * bookmarkletsRefresh lets AppToolbar/HomeView (import can happen from either) tell
 * BookmarkletsView the data changed, without a full page reload. Mirrors toolsRefresh.ts.
 */
import { ref } from 'vue'

export const bookmarkletsRefreshSignal = ref(0)

export function notifyBookmarkletsChanged(): void {
  bookmarkletsRefreshSignal.value++
}
