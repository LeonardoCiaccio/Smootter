/**
 * toolsDb — IndexedDB-backed storage for generated tools.
 * Preferences use chrome.storage.local (simple key-value); tools are
 * structured records (name, config, generated code) that need real
 * indexing/querying as the library grows, so they get a real database.
 * Available in every context (service worker, extension pages).
 */

import type { ChatMessage } from './messages'

export type ToolTrigger = 'pageStart' | 'pageIdle'
export type ToolScope = 'everywhere' | 'domain'

export interface StoredTool {
  id: string
  name: string
  description: string
  trigger: ToolTrigger
  scope: ToolScope
  scopeTargets: string
  code: string
  enabled: boolean
  createdAt: number
  updatedAt: number
  // The build chat, so reopening a tool to edit it picks the conversation
  // back up instead of starting cold. Capped at save time — see WizardStepTester.
  chatMessages: ChatMessage[]
}

const DB_NAME = chrome.runtime.getManifest().short_name + '_tools'
const DB_VERSION = 1
const STORE_NAME = 'tools'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Insert or update a tool. */
export async function saveTool(tool: StoredTool): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    // `tool` often comes from Vue reactive state — its Proxy wrapper isn't
    // structured-clone-safe ("DataCloneError"). A JSON round-trip strips it
    // down to plain, cloneable data; every field here is JSON-safe already.
    transaction.objectStore(STORE_NAME).put(JSON.parse(JSON.stringify(tool)))
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/** A single tool by id, or undefined if not found. */
export async function getTool(id: string): Promise<StoredTool | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(id)
    request.onsuccess = () => resolve(request.result as StoredTool | undefined)
    request.onerror = () => reject(request.error)
  })
}

/** All saved tools. */
export async function getAllTools(): Promise<StoredTool[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve(request.result as StoredTool[])
    request.onerror = () => reject(request.error)
  })
}

/** Enable or disable a tool without touching its other fields. */
export async function setToolEnabled(id: string, enabled: boolean): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)
    request.onsuccess = () => {
      const tool = request.result as StoredTool | undefined
      if (tool) store.put({ ...tool, enabled })
    }
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/** Remove a tool by id. */
export async function deleteTool(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}
