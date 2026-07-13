/**
 * toolsEngine — runs saved tools for real, as the user browses.
 * Imperative and per-navigation, not a declarative chrome.userScripts.register()
 * covering every stored tool up front: each navigation event looks up
 * matching tools in IndexedDB right then and executes them via
 * chrome.userScripts.execute() (never eval). This keeps tool storage and
 * live execution fully decoupled — saving/editing/deleting a tool never
 * needs to "sync" a global registration, it's just read fresh on the next
 * navigation.
 *
 * Trade-off: for `pageStart` this is a best-effort "as early as possible",
 * not the hard document_start guarantee a declarative registration would
 * give — there's an unavoidable async gap (event → DB lookup → execute())
 * during which the page's own scripts may already be running. Acceptable
 * here: this isn't a security boundary, just a timing preference.
 */
import { getAllTools, type StoredTool, type ToolTrigger } from '@/shared/toolsDb'
import { buildGuardedCode } from './guardedCode'

/** Whether a user-entered domain/page pattern (see Wizard's DOMAIN_PATTERN) matches `url`. */
function matchesTarget(entry: string, url: URL): boolean {
  const withoutScheme = entry.replace(/^https?:\/\//, '')
  const slashIndex = withoutScheme.indexOf('/')
  const hostPart = slashIndex === -1 ? withoutScheme : withoutScheme.slice(0, slashIndex)
  const pathPart = slashIndex === -1 ? '' : withoutScheme.slice(slashIndex)

  let hostMatches: boolean
  if (hostPart.startsWith('*.')) {
    const suffix = hostPart.slice(2)
    // The Wizard's own DOMAIN_PATTERN already requires 2+ labels after "*." (rejecting "*.com"),
    // but a hand-edited or imported tool can carry a scopeTargets string that skipped that UI
    // check — this is the last line of defense against a wildcard matching every domain under a
    // public TLD.
    hostMatches = suffix.includes('.') && (url.hostname === suffix || url.hostname.endsWith('.' + suffix))
  } else {
    hostMatches = url.hostname === hostPart
  }

  if (!hostMatches) return false
  return pathPart === '' || url.pathname.startsWith(pathPart)
}

function toolMatchesUrl(tool: StoredTool, url: URL): boolean {
  if (tool.scope === 'everywhere') return true
  return tool.scopeTargets
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .some((entry) => matchesTarget(entry, url))
}

async function findMatchingTools(rawUrl: string, trigger: ToolTrigger): Promise<StoredTool[]> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return []
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return []

  const tools = await getAllTools()
  return tools.filter((tool) => tool.enabled && tool.trigger === trigger && toolMatchesUrl(tool, url))
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

/** Runs one tool's code for real on `tabId`; logs (never throws) on failure. */
async function runTool(tool: StoredTool, tabId: number): Promise<void> {
  try {
    const results = await chrome.userScripts.execute({
      target: { tabId },
      js: [{ code: buildGuardedCode(tool.code) }],
      // USER_SCRIPT, not MAIN: a separate JS realm from the page's own scripts — the page's CSP
      // doesn't apply, and the page can't observe or tamper with the tool's execution (or vice
      // versa). The DOM is still the same, so DOM automation (what every tool actually does)
      // works identically; only reaching the page's own JS globals/functions would need MAIN,
      // which is not something Smootter's tools are meant to do.
      world: 'USER_SCRIPT',
    })
    const outcome = results[0]?.result as { ok: boolean; error?: string } | undefined
    if (outcome && !outcome.ok) {
      console.error(`[Smootter] Tool "${tool.name}" threw:`, outcome.error)
    }
  } catch (error) {
    console.error(`[Smootter] Tool "${tool.name}" failed to run:`, describeError(error))
  }
}

/** Runs every saved tool matching `url` and `trigger` on `tabId`. */
export async function runMatchingTools(tabId: number, url: string, trigger: ToolTrigger): Promise<void> {
  const tools = await findMatchingTools(url, trigger)
  await Promise.all(tools.map((tool) => runTool(tool, tabId)))
}

/** Watches tab navigation and runs matching tools at the right moment. */
export function registerToolsEngine(): void {
  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId !== 0) return
    void runMatchingTools(details.tabId, details.url, 'pageStart')
  })

  chrome.webNavigation.onCompleted.addListener((details) => {
    if (details.frameId !== 0) return
    void runMatchingTools(details.tabId, details.url, 'pageIdle')
  })
}
