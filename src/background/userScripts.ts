/**
 * userScripts status check for the chrome.userScripts execution engine.
 * Generated tool code runs in the USER_SCRIPT world via the Chrome-sanctioned
 * User Scripts API (the same mechanism userscript managers like Tampermonkey
 * use) never eval, never a remote script tag. See toolsEngine.ts.
 */

/**
 * Whether the user has enabled "Allow User Scripts" for this extension
 * (chrome://extensions → this extension → Allow User Scripts). Chrome
 * exposes no direct flag for this calling any userScripts method is the
 * documented way to detect it: it rejects when the toggle is off.
 */
export async function isUserScriptsEnabled(): Promise<boolean> {
  try {
    await chrome.userScripts.getScripts()
    return true
  } catch {
    return false
  }
}
