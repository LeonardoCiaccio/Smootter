/** Whether an LLM endpoint points at a local runtime (Ollama, LM Studio, ...) — those don't need an API key. */
export function isLocalLlmEndpoint(url: string): boolean {
  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    return false
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true
  // Private LAN ranges, in case the runtime is reached via a local network address.
  return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)
}
