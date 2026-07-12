/**
 * bookmarkletsDb — IndexedDB-backed storage for saved page bookmarks and
 * their categories. Separate database from toolsDb: different entity,
 * different lifecycle, no reason to share a store.
 */

export interface StoredBookmarklet {
  id: string
  title: string
  url: string
  description: string
  tags: string[]
  categoryId: string
  createdAt: number
  updatedAt: number
}

export interface StoredCategory {
  id: string
  name: string
}

/** Always present, never deletable — the catch-all category bookmarklets fall back to. */
export const UNCATEGORIZED_CATEGORY_ID = 'uncategorized'

const DB_NAME = chrome.runtime.getManifest().short_name + '_bookmarklets'
const DB_VERSION = 1
const BOOKMARKLETS_STORE = 'bookmarklets'
const CATEGORIES_STORE = 'categories'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(BOOKMARKLETS_STORE)) {
        db.createObjectStore(BOOKMARKLETS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(CATEGORIES_STORE)) {
        db.createObjectStore(CATEGORIES_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Insert or update a bookmarklet. */
export async function saveBookmarklet(bookmarklet: StoredBookmarklet): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOOKMARKLETS_STORE, 'readwrite')
    transaction.objectStore(BOOKMARKLETS_STORE).put(JSON.parse(JSON.stringify(bookmarklet)))
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/** All saved bookmarklets. */
export async function getAllBookmarklets(): Promise<StoredBookmarklet[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOOKMARKLETS_STORE, 'readonly')
    const request = transaction.objectStore(BOOKMARKLETS_STORE).getAll()
    request.onsuccess = () => resolve(request.result as StoredBookmarklet[])
    request.onerror = () => reject(request.error)
  })
}

/**
 * Reassigns any bookmarklet whose categoryId doesn't match a known category
 * (stale data — e.g. from before "uncategorized" existed as a real category,
 * or a category deleted through some other path) to the fixed "uncategorized"
 * category, persisting the fix. Called on load so these can't accumulate as
 * ghost records invisible to the sidebar. Returns the corrected list.
 */
export async function reconcileOrphanBookmarklets(categories: StoredCategory[]): Promise<StoredBookmarklet[]> {
  const knownCategoryIds = new Set(categories.map((category) => category.id))
  const all = await getAllBookmarklets()
  const now = Date.now()
  const fixed = all.map((bookmarklet) =>
    knownCategoryIds.has(bookmarklet.categoryId)
      ? bookmarklet
      : { ...bookmarklet, categoryId: UNCATEGORIZED_CATEGORY_ID, updatedAt: now },
  )
  await Promise.all(
    fixed
      .filter((bookmarklet, index) => bookmarklet !== all[index])
      .map((bookmarklet) => saveBookmarklet(bookmarklet)),
  )
  return fixed
}

/** Remove a bookmarklet by id. */
export async function deleteBookmarklet(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOOKMARKLETS_STORE, 'readwrite')
    transaction.objectStore(BOOKMARKLETS_STORE).delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/** Strips `tag` from every bookmarklet that has it. Returns the updated bookmarklets. */
export async function deleteTagEverywhere(tag: string): Promise<StoredBookmarklet[]> {
  const all = await getAllBookmarklets()
  const now = Date.now()
  const updated = all.map((bookmarklet) =>
    bookmarklet.tags.includes(tag)
      ? { ...bookmarklet, tags: bookmarklet.tags.filter((existing) => existing !== tag), updatedAt: now }
      : bookmarklet,
  )
  await Promise.all(
    updated
      .filter((bookmarklet, index) => bookmarklet !== all[index])
      .map((bookmarklet) => saveBookmarklet(bookmarklet)),
  )
  return updated
}

/** Insert or update a category. */
export async function saveCategory(category: StoredCategory): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CATEGORIES_STORE, 'readwrite')
    transaction.objectStore(CATEGORIES_STORE).put(JSON.parse(JSON.stringify(category)))
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/** Seeds the fixed "uncategorized" category the first time it's missing. */
async function ensureUncategorizedCategory(categories: StoredCategory[]): Promise<StoredCategory[]> {
  if (categories.some((category) => category.id === UNCATEGORIZED_CATEGORY_ID)) return categories

  const uncategorized: StoredCategory = {
    id: UNCATEGORIZED_CATEGORY_ID,
    name: chrome.i18n.getMessage('bookmarkletsUncategorized'),
  }
  await saveCategory(uncategorized)
  return [uncategorized, ...categories]
}

/** All saved categories — always includes the fixed "uncategorized" one, seeding it if needed. */
export async function getAllCategories(): Promise<StoredCategory[]> {
  const db = await openDb()
  const categories = await new Promise<StoredCategory[]>((resolve, reject) => {
    const transaction = db.transaction(CATEGORIES_STORE, 'readonly')
    const request = transaction.objectStore(CATEGORIES_STORE).getAll()
    request.onsuccess = () => resolve(request.result as StoredCategory[])
    request.onerror = () => reject(request.error)
  })
  return ensureUncategorizedCategory(categories)
}

/**
 * Removes a category (the fixed "uncategorized" one can't be deleted — a
 * no-op). Bookmarklets that were in it fall back to "uncategorized" rather
 * than being deleted — a category disappearing shouldn't take the links
 * with it. Returns the updated bookmarklets.
 */
export async function deleteCategory(id: string): Promise<StoredBookmarklet[]> {
  if (id === UNCATEGORIZED_CATEGORY_ID) return getAllBookmarklets()

  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(CATEGORIES_STORE, 'readwrite')
    transaction.objectStore(CATEGORIES_STORE).delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })

  const all = await getAllBookmarklets()
  const now = Date.now()
  const updated = all.map((bookmarklet) =>
    bookmarklet.categoryId === id
      ? { ...bookmarklet, categoryId: UNCATEGORIZED_CATEGORY_ID, updatedAt: now }
      : bookmarklet,
  )
  await Promise.all(
    updated
      .filter((bookmarklet, index) => bookmarklet !== all[index])
      .map((bookmarklet) => saveBookmarklet(bookmarklet)),
  )
  return updated
}
