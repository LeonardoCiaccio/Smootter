/**
 * guardedCode — wraps a tool's raw code so its outcome (success or thrown
 * error) becomes the completion value of a chrome.userScripts.execute()
 * injection. chrome.userScripts.execute() does NOT reject when injected
 * code throws (only on injection-level failures), so this is the only way
 * to actually know whether it threw.
 */
export function buildGuardedCode(code: string): string {
  return `(async () => {
    try {
      ${code}
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error && error.message ? String(error.message) : String(error) };
    }
  })()`
}
