/**
 * testRunner — runs a tool's code for real, in a controlled, isolated way.
 * Never calls eval/Function ourselves: the code runs via
 * chrome.userScripts.execute() (the one Chrome-sanctioned API for this), a
 * direct one-shot call targeting a fresh, invisible iframe injected into the
 * real webpage tab the wizard is already open on (chrome.userScripts cannot
 * target our own chrome-extension:// pages — and running untrusted tool code
 * inside our privileged UI would be unsafe anyway).
 *
 * The iframe is `sandbox="allow-scripts"` with a srcdoc (never `about:blank`, which inherits
 * the host page's origin): that gives it an opaque origin, so the code under test genuinely
 * cannot reach the real page's DOM, cookies, or storage through window.parent — an
 * `about:blank` frame could. Cleanup is just removing the iframe — no per-element tagging
 * needed. We only care whether the call itself completes without throwing, not what it
 * returns or renders.
 *
 * chrome.userScripts.execute() does NOT reject when the injected code
 * throws (it only rejects on injection-level failures, e.g. bad target) —
 * a runtime error inside the code is otherwise silently swallowed. So the
 * code is wrapped in a real try/catch before being handed to the sanctioned
 * API, and the outcome is read back as the injection's completion value:
 * the actual, governed source of truth for whether it threw.
 */
import { buildGuardedCode } from './guardedCode'

const FRAME_READY_TIMEOUT_MS = 5000
const FRAME_POLL_INTERVAL_MS = 50

export interface TestResult {
  ok: boolean
  error?: string
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Creates an invisible, disposable iframe on the tab and resolves with its frameId. */
async function createTestFrame(tabId: number, frameToken: string): Promise<number> {
  const before = await chrome.webNavigation.getAllFrames({ tabId })
  const beforeIds = new Set((before ?? []).map((frame) => frame.frameId))

  await chrome.scripting.executeScript({
    target: { tabId },
    func: (token: string) => {
      const iframe = document.createElement('iframe')
      // sandbox + srcdoc gives the frame an opaque origin — the test code cannot reach the
      // host page's DOM, cookies or storage through window.parent. about:blank would inherit
      // the host page's origin instead, making "isolated" a false claim.
      iframe.setAttribute('sandbox', 'allow-scripts')
      iframe.srcdoc = '<!doctype html><meta charset="utf-8">'
      iframe.setAttribute('data-smootter-test-frame', token)
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;'
      document.documentElement.appendChild(iframe)
    },
    args: [frameToken],
  })

  const deadline = Date.now() + FRAME_READY_TIMEOUT_MS
  while (Date.now() < deadline) {
    const after = await chrome.webNavigation.getAllFrames({ tabId })
    const newFrame = (after ?? []).find((frame) => !beforeIds.has(frame.frameId))
    if (newFrame) return newFrame.frameId
    await sleep(FRAME_POLL_INTERVAL_MS)
  }
  throw new Error('Test frame did not load in time.')
}

/** Removes the test iframe (and everything it did — DOM, timers, globals) in one shot. */
async function removeTestFrame(tabId: number, frameToken: string): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (token: string) => {
        document.querySelector(`[data-smootter-test-frame="${token}"]`)?.remove()
      },
      args: [frameToken],
    })
  } catch {
    // Tab may already be closed or navigated away — nothing left to clean up.
  }
}

/** Runs `code` for real, isolated in a disposable iframe on `tabId`, and reports if it threw. */
export async function runCodeTest(code: string, tabId: number | undefined): Promise<TestResult> {
  if (tabId === undefined) {
    return { ok: false, error: 'Open the tool builder from a webpage to test the code.' }
  }

  const frameToken = crypto.randomUUID()
  let frameId: number
  try {
    frameId = await createTestFrame(tabId, frameToken)
  } catch (error) {
    return { ok: false, error: describeError(error) }
  }

  let result: TestResult
  try {
    const injectionResults = await chrome.userScripts.execute({
      target: { tabId, frameIds: [frameId] },
      js: [{ code: buildGuardedCode(code, { silenceAlert: true }) }],
      // Must match the real run's world (toolsEngine.ts) — otherwise "test passed" doesn't
      // actually predict the outcome of the real execution.
      world: 'USER_SCRIPT',
    })
    result = (injectionResults[0]?.result as TestResult | undefined) ?? {
      ok: false,
      error: 'No result from the test run.',
    }
  } catch (error) {
    result = { ok: false, error: describeError(error) }
  }

  await removeTestFrame(tabId, frameToken)
  return result
}
