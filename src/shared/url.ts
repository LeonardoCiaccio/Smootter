/** The hostname of `url`, or '' if it isn't a valid URL. */
export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}
