/**
 * toolsDb — IndexedDB-backed storage for generated tools.
 * Preferences use chrome.storage.local (simple key-value); tools are
 * structured records (name, config, generated code) that need real
 * indexing/querying as the library grows, so they get a real database.
 * Available in every context (service worker, extension pages).
 *
 * Not wired into the wizard yet — the "build" step that produces `code`
 * doesn't exist. This module is the storage layer, ready for it.
 */

export type ToolTrigger = 'manual' | 'pageStart' | 'pageIdle'
export type ToolScope = 'everywhere' | 'domain'

export interface StoredTool {
  id: string
  name: string
  description: string
  trigger: ToolTrigger
  scope: ToolScope
  scopeTargets: string
  code: string
  createdAt: number
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
    transaction.objectStore(STORE_NAME).put(tool)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
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
