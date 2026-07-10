/**
 * testRunner — runs a tool's code for real, in a controlled, isolated way.
 * Never calls eval/Function ourselves: the code runs via
 * chrome.userScripts.execute() (the one Chrome-sanctioned API for this), a
 * direct one-shot call targeting a fresh, invisible iframe injected into the
 * real webpage tab the wizard is already open on (chrome.userScripts cannot
 * target our own chrome-extension:// pages — and running untrusted tool code
 * inside our privileged UI would be unsafe anyway).
 *
 * The iframe means the test never touches the real page or our own code: it
 * gets its own DOM, and cleanup is just removing the iframe — no per-element
 * tagging needed. We only care whether the call itself completes without
 * throwing, not what it returns or renders.
 *
 * chrome.userScripts.execute() does NOT reject when the injected code
 * throws (it only rejects on injection-level failures, e.g. bad target) —
 * a runtime error inside the code is otherwise silently swallowed. So the
 * code is wrapped in a real try/catch before being handed to the sanctioned
 * API, and the outcome is read back as the injection's completion value:
 * the actual, governed source of truth for whether it threw.
 */
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
      iframe.src = 'about:blank'
      iframe.setAttribute('data-pippo-test-frame', token)
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
        document.querySelector(`[data-pippo-test-frame="${token}"]`)?.remove()
      },
      args: [frameToken],
    })
  } catch {
    // Tab may already be closed or navigated away — nothing left to clean up.
  }
}

/**
 * The test frame is invisible, so a blocking window.alert() would hang
 * forever with no way for anyone to dismiss it. Overridden here only, never
 * for the tool's real, deployed execution (see ../background/toolsEngine.ts).
 */
function buildGuardedTestCode(code: string): string {
  return `(async () => {
    window.alert = function (message) { console.log('[Pippo test] alert:', message); };
    try {
      ${code}
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error && error.message ? String(error.message) : String(error) };
    }
  })()`
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
      js: [{ code: buildGuardedTestCode(code) }],
      world: 'MAIN',
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
