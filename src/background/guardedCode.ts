/**
 * guardedCode wraps a tool's raw code so its outcome (success or thrown
 * error) becomes the completion value of a chrome.userScripts.execute()
 * injection. chrome.userScripts.execute() does NOT reject when injected
 * code throws (only on injection-level failures), so this is the only way
 * to actually know whether it threw.
 */
export interface GuardedCodeOptions {
  /**
   * The test frame is invisible, so a blocking window.alert() would hang forever with no way
   * for anyone to dismiss it. Only for test runs never for a tool's real, deployed execution.
   */
  silenceAlert?: boolean
}

/**
 * `code` runs inside its own inner function, on its own line, so a trailing line comment or a
 * top-level `return` in it can only affect that inner function never swallow or skip the
 * guard's own `return { ok: true }` that follows.
 */
export function buildGuardedCode(code: string, options: GuardedCodeOptions = {}): string {
  const alertOverride = options.silenceAlert
    ? "window.alert = function (message) { console.log('[Smootter test] alert:', message); };"
    : ''
  return `(async () => {
    ${alertOverride}
    try {
      await (async () => {
${code}
      })();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error && error.message ? String(error.message) : String(error) };
    }
  })()`
}
