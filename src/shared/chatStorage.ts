/**
 * chatStorage — per-domain Chat view history, stored in chrome.storage.session: in-memory
 * only, never written to disk, cleared automatically the moment the browser restarts. Keyed by
 * hostname (not full URL) — chatting on google.com stays scoped to google.com regardless of
 * which page on it you're on. Deliberately never touched by exportImport.ts.
 */
import { capChatMessages, type ChatMessage } from './messages'
import { hostnameOf } from './url'

function storageKey(pageUrl: string): string {
  const hostname = hostnameOf(pageUrl)
  return `smootter_chat_${hostname !== '' ? hostname : 'unknown'}`
}

/** The persisted conversation for the domain of `pageUrl`, or an empty transcript. */
export async function getChatMessages(pageUrl: string): Promise<ChatMessage[]> {
  const key = storageKey(pageUrl)
  const stored = await chrome.storage.session.get(key)
  return (stored[key] as ChatMessage[] | undefined) ?? []
}

/** Overwrites the persisted conversation for the domain of `pageUrl`. Capped regardless of caller. */
export async function saveChatMessages(pageUrl: string, messages: ChatMessage[]): Promise<void> {
  const key = storageKey(pageUrl)
  await chrome.storage.session.set({ [key]: capChatMessages(messages) })
}

/** Clears the persisted conversation for the domain of `pageUrl`. */
export async function clearChatMessages(pageUrl: string): Promise<void> {
  const key = storageKey(pageUrl)
  await chrome.storage.session.remove(key)
}
