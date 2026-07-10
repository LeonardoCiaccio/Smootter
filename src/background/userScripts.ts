/**
 * userScripts — bridges the chrome.userScripts execution engine.
 * Generated tool code runs in the isolated USER_SCRIPT world via the
 * Chrome-sanctioned User Scripts API (the same mechanism userscript
 * managers like Tampermonkey use) — never eval, never a remote script tag.
 *
 * Messaging from that world is deliberately routed through dedicated
 * onUserScriptMessage/onUserScriptConnect handlers, kept separate from the
 * internal channel (./channel.ts) since generated code is a lower trust tier.
 */

/**
 * Whether the user has enabled "Allow User Scripts" for this extension
 * (chrome://extensions → this extension → Allow User Scripts). Chrome
 * exposes no direct flag for this — calling any userScripts method is the
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

/** Allow USER_SCRIPT-world code to message the extension (opt-in, off by default). */
async function enableUserScriptMessaging(): Promise<void> {
  try {
    await chrome.userScripts.configureWorld({ messaging: true })
  } catch {
    // "Allow User Scripts" isn't enabled yet — nothing to configure until it is.
  }
}

/** Handle a one-off message from a running user script. */
function handleUserScriptMessage(): void {
  // No generated tools exist yet (the wizard's build step isn't implemented).
  // Wired up now so the engine has somewhere to receive their output later.
}

/** Handle a persistent connection from a running user script. */
function handleUserScriptConnect(): void {
  // Same as above: ready for future tool output, nothing to route yet.
}

/** Start listening for user-script messaging and prepare the USER_SCRIPT world. */
export function registerUserScriptBridge(): void {
  void enableUserScriptMessaging()
  chrome.runtime.onUserScriptMessage.addListener(handleUserScriptMessage)
  chrome.runtime.onUserScriptConnect.addListener(handleUserScriptConnect)
}
