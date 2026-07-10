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
 *
 * Test runs happen on the real page the user is browsing, so anything the
 * code adds to the DOM (a popup, a banner, ...) would otherwise linger there
 * forever. Each run tags whatever it newly appended to <body>/<head> with a
 * unique marker, and cleanupTestArtifacts() removes it once the test step is
 * left or the tool is saved.
 */
function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export interface TestResult {
  ok: boolean
  error?: string
  testId?: string
}

// Which tab each test's tagged DOM artifacts live on, until cleaned up.
const testTabs = new Map<string, number>()

function buildTestCode(code: string, testId: string): string {
  const marker = JSON.stringify(testId)
  return `(async () => {
    const __pippoBefore = new Set([...document.body.children, ...document.head.children]);
    const __pippoTagNewNodes = () => {
      for (const el of [...document.body.children, ...document.head.children]) {
        if (!__pippoBefore.has(el)) el.setAttribute('data-pippo-test', ${marker});
      }
    };
    try {
      ${code}
      __pippoTagNewNodes();
      return { ok: true };
    } catch (error) {
      __pippoTagNewNodes();
      return { ok: false, error: error && error.message ? String(error.message) : String(error) };
    }
  })()`
}

/** Runs `code` for real on `tabId`, catching any error it throws, and reports the outcome. */
export async function runCodeTest(code: string, tabId: number | undefined): Promise<TestResult> {
  if (tabId === undefined) {
    return { ok: false, error: 'Open the tool builder from a webpage to test the code.' }
  }

  const testId = crypto.randomUUID()
  try {
    const injectionResults = await chrome.userScripts.execute({
      target: { tabId },
      js: [{ code: buildTestCode(code, testId) }],
      world: 'MAIN',
    })
    testTabs.set(testId, tabId)
    const outcome = injectionResults[0]?.result as { ok: boolean; error?: string } | undefined
    return { ...(outcome ?? { ok: false, error: 'No result from the test run.' }), testId }
  } catch (error) {
    return { ok: false, error: describeError(error) }
  }
}

/** Removes whatever DOM the given test run tagged (popup, banner, ...), if the tab is still open. */
export async function cleanupTestArtifacts(testId: string): Promise<void> {
  const tabId = testTabs.get(testId)
  if (tabId === undefined) return
  testTabs.delete(testId)

  const selector = JSON.stringify(`[data-pippo-test="${testId}"]`)
  try {
    await chrome.userScripts.execute({
      target: { tabId },
      js: [{ code: `document.querySelectorAll(${selector}).forEach((el) => el.remove());` }],
      world: 'MAIN',
    })
  } catch {
    // Tab may already be closed or navigated away — nothing left to clean up.
  }
}
