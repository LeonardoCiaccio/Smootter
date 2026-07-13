/** The hostname of `url`, or '' if it isn't a valid URL. */
export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

/** The file extension of `url`'s path (no dot, lowercase), or '' if there isn't one. */
export function fileExtensionOf(url: string): string {
  try {
    const path = new URL(url).pathname
    const match = /\.([a-z0-9]{1,8})$/i.exec(path)
    return match ? match[1].toLowerCase() : ''
  } catch {
    return ''
  }
}

/**
 * Whether `url` is a plain, navigable web URL. Anything else (javascript:, data:, file:, ...)
 * must never reach an href binding or a downloads.download() call — Vue does not sanitize
 * href bindings, and a javascript: URI is only harmless today because of a CSP that isn't
 * declared explicitly.
 */
export function isSafeWebUrl(url: string): boolean {
  try {
    const protocol = new URL(url).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}
