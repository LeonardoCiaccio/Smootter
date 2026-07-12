/**
 * openEnvironment — injects environment.ts (the host-page modal + iframe shell) into a tab.
 * Shared by the toolbar action and the context menu: a plain injection toggles open/closed
 * (the toolbar's existing behavior), while passing `route` also navigates straight to that
 * path — used by the context menu to jump directly to Network/Bookmarklets/Options/Tools.
 *
 * The route can't be passed as an executeScript `args` to environment.ts itself (it's injected
 * via `files`, which doesn't support args) — instead a tiny inline `func` call sets a global on
 * the tab's isolated world just before the file runs, which environment.ts reads on startup.
 */

/** Injects environment.ts. With no route, replicates the toolbar's plain toggle-open/close click. */
export async function openEnvironment(tabId: number, route?: string): Promise<void> {
  if (route !== undefined) {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (initialRoute: string) => {
        ;(window as unknown as { __smootterInitialRoute?: string }).__smootterInitialRoute = initialRoute
      },
      args: [route],
    })
  }
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['environment.js'],
  })
}
