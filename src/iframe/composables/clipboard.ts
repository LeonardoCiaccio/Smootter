/**
 * clipboard — writes text to the clipboard, falling back to the legacy execCommand('copy')
 * when the modern Clipboard API is blocked. Cross-origin iframes are denied clipboard-write by
 * the browser's default Permissions Policy regardless of the iframe's own `allow` attribute (a
 * known Chromium constraint, https://crbug.com/414348233) — happens on every host page, not just
 * ones with a restrictive header. execCommand('copy') isn't gated by that policy and runs
 * synchronously in this same document, so it keeps working here.
 */
function copyViaExecCommand(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(textarea)
  return ok
}

/** Writes `text` to the clipboard; true on success. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return copyViaExecCommand(text)
  }
}
