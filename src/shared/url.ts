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
