/**
 * testRunner — orchestrates a real, isolated test run of a tool's code.
 * Never calls eval/Function ourselves: the code is registered via
 * chrome.userScripts (the one Chrome-sanctioned API for this), timed by the
 * tool's own trigger, on a dedicated bundled test page. That page's own
 * script supervises execution (a plain `window` error listener) and reports
 * back — we only relay the verdict.
 */
import type { ToolTrigger } from '@/shared/toolsDb'

const TEST_RESULT_TIMEOUT_MS = 8000

export interface TestResult {
  ok: boolean
  error?: string
}

const pendingTests = new Map<string, (result: TestResult) => void>()

/** Called when the test page's supervisor reports its verdict. */
export function resolveTestResult(requestId: string, result: TestResult): void {
  const resolve = pendingTests.get(requestId)
  if (!resolve) return
  pendingTests.delete(requestId)
  resolve(result)
}

function waitForResult(requestId: string): Promise<TestResult> {
  return new Promise((resolve) => {
    pendingTests.set(requestId, resolve)
    setTimeout(() => {
      if (!pendingTests.has(requestId)) return
      pendingTests.delete(requestId)
      resolve({ ok: false, error: 'timeout' })
    }, TEST_RESULT_TIMEOUT_MS)
  })
}

/** Run `code` on a fresh test page, timed by `trigger`, and report if it threw. */
export async function runCodeTest(code: string, trigger: ToolTrigger): Promise<TestResult> {
  const requestId = crypto.randomUUID()
  const testPageUrl = chrome.runtime.getURL('src/testpage/index.html')
  const scriptId = 'pippo-test-' + requestId

  await chrome.userScripts.register([
    {
      id: scriptId,
      // Match patterns ignore the query string, so the exact path is enough
      // to also match testPageUrl + "?rid=...".
      matches: [testPageUrl],
      js: [{ code }],
      runAt: trigger === 'pageStart' ? 'document_start' : 'document_idle',
      world: 'MAIN',
    },
  ])

  const resultPromise = waitForResult(requestId)
  await chrome.tabs.create({ url: `${testPageUrl}?rid=${requestId}`, active: true })

  const result = await resultPromise
  await chrome.userScripts.unregister({ ids: [scriptId] })
  return result
}
