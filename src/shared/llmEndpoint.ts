import { isPrivateOrLoopbackHost } from './network'

/** Whether an LLM endpoint points at a local runtime (Ollama, LM Studio, ...) those don't need an API key. */
export function isLocalLlmEndpoint(url: string): boolean {
  try {
    return isPrivateOrLoopbackHost(new URL(url).hostname)
  } catch {
    return false
  }
}
