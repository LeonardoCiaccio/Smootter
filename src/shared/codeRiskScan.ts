/**
 * Lightweight heuristic scan for a generated tool's code, surfaced as a non-blocking warning
 * before save (never a block: a false positive shouldn't stop a legitimate tool, and this is a
 * platform for arbitrary user code by design). Flags the combination of reading a credential-ish
 * storage AND sending data out, since that pairing is what a prompt-injected exfiltration
 * snippet needs and is unlikely to appear together in ordinary tool code by chance.
 */
const STORAGE_READ_PATTERNS = [/document\.cookie/, /localStorage/, /sessionStorage/]
const NETWORK_SEND_PATTERNS = [/\bfetch\s*\(/, /XMLHttpRequest/, /sendBeacon/]

export function scanForRiskyPatterns(code: string): boolean {
  const readsStorage = STORAGE_READ_PATTERNS.some((pattern) => pattern.test(code))
  const sendsNetwork = NETWORK_SEND_PATTERNS.some((pattern) => pattern.test(code))
  return readsStorage && sendsNetwork
}
