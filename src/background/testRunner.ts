/**
 * testRunner — runs a tool's code for real, in a controlled way.
 * Never calls eval/Function ourselves: the code runs via
 * chrome.userScripts.execute() (the one Chrome-sanctioned API for this), a
 * direct one-shot call targeting the real webpage tab the wizard is already
 * open on (chrome.userScripts cannot target our own chrome-extension://
 * pages — and running untrusted tool code inside our privileged UI would be
 * unsafe anyway).
 *
 * chrome.userScripts.execute() does NOT reject when the injected code
 * throws (it only rejects on injection-level failures, e.g. bad target) —
 * a runtime error inside the code is otherwise silently swallowed. So the
 * code is wrapped in a real try/catch before being handed to the sanctioned
 * API, and the outcome is read back as the injection's completion value:
 * the actual, governed source of truth for whether it threw.
 */
export interface TestResult {
  ok: boolean
  error?: string
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

/** Wraps the tool's code so its outcome (success or thrown error) becomes the injection's return value. */
function buildGuardedCode(code: string): string {
  return `(async () => {
    try {
      ${code}
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error && error.message ? String(error.message) : String(error) };
    }
  })()`
}

/** Runs `code` for real on `tabId`, catching any error it throws, and reports the outcome. */
export async function runCodeTest(code: string, tabId: number | undefined): Promise<TestResult> {
  if (tabId === undefined) {
    return { ok: false, error: 'Open the tool builder from a webpage to test the code.' }
  }

  try {
    const injectionResults = await chrome.userScripts.execute({
      target: { tabId },
      js: [{ code: buildGuardedCode(code) }],
      world: 'MAIN',
    })
    const outcome = injectionResults[0]?.result as TestResult | undefined
    return outcome ?? { ok: false, error: 'No result from the test run.' }
  } catch (error) {
    return { ok: false, error: describeError(error) }
  }
}
