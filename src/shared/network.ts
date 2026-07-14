/**
 * network shared private/loopback-network detection, used with opposite intent in two places:
 * llmEndpoint.ts permits these hosts (local LLM runtimes don't need an API key), fetchTarget
 * guards in llmClient.ts block them (the model must not reach the user's LAN via fetch_url).
 */

/** Whether `hostname` is loopback, link-local, or a private LAN range (RFC 1918 / RFC 4193). */
export function isPrivateOrLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) return true
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:'))
    return true
  return /^(127\.|0\.|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
}
