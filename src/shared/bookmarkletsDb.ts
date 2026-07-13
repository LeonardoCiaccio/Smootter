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
  // Lowercased, deduplicated words from title + description + tags + url — recomputed on every
  // save, indexed (multiEntry) so the AI search tool can query the DB directly by term instead
  // of loading every bookmarklet into memory. See queryBookmarklets.
  searchTerms: string[]
}

export interface StoredCategory {
  id: string
  name: string
}

/**
 * A favicon, keyed by domain (not per-bookmarklet) since several saved pages
 * often share the same site and therefore the same icon — one base64 copy
 * per domain instead of duplicating it on every bookmarklet.
 */
export interface StoredFavicon {
  domain: string
  dataUrl: string
}

/** Always present, never deletable — the catch-all category bookmarklets fall back to. */
export const UNCATEGORIZED_CATEGORY_ID = 'uncategorized'

const DB_NAME = chrome.runtime.getManifest().short_name + '_bookmarklets'
const DB_VERSION = 3
const BOOKMARKLETS_STORE = 'bookmarklets'
const CATEGORIES_STORE = 'categories'
const FAVICONS_STORE = 'favicons'
const SEARCH_TERMS_INDEX = 'searchTerms'

/** Lowercased, deduplicated words — splits on anything that isn't a letter or digit. */
function tokenize(text: string): string[] {
  return Array.from(new Set(text.toLowerCase().split(/[^a-z0-9]+/i).filter((word) => word !== '')))
}

function computeSearchTerms(bookmarklet: Pick<StoredBookmarklet, 'title' | 'description' | 'tags' | 'url'>): string[] {
  return tokenize([bookmarklet.title, bookmarklet.description, bookmarklet.tags.join(' '), bookmarklet.url].join(' '))
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = request.result
      if (!db.objectStoreNames.contains(BOOKMARKLETS_STORE)) {
        db.createObjectStore(BOOKMARKLETS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(CATEGORIES_STORE)) {
        db.createObjectStore(CATEGORIES_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(FAVICONS_STORE)) {
        db.createObjectStore(FAVICONS_STORE, { keyPath: 'domain' })
      }

      // request.transaction is the versionchange transaction — spans every store above, even
      // ones just created this same upgrade.
      const bookmarkletsStore = request.transaction!.objectStore(BOOKMARKLETS_STORE)
      if (!bookmarkletsStore.indexNames.contains(SEARCH_TERMS_INDEX)) {
        bookmarkletsStore.createIndex(SEARCH_TERMS_INDEX, SEARCH_TERMS_INDEX, { multiEntry: true })
      }

      // Records saved before this field existed have none — backfill them here, in the same
      // transaction, so nothing goes unsearchable until it happens to be edited again.
      if (event.oldVersion < 3) {
        bookmarkletsStore.openCursor().onsuccess = (cursorEvent) => {
          const cursor = (cursorEvent.target as IDBRequest<IDBCursorWithValue | null>).result
          if (!cursor) return
          const bookmarklet = cursor.value as StoredBookmarklet
          cursor.update({ ...bookmarklet, searchTerms: computeSearchTerms(bookmarklet) })
          cursor.continue()
        }
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Insert or update a bookmarklet. `searchTerms` is always recomputed here — never trust the caller's copy. */
export async function saveBookmarklet(bookmarklet: StoredBookmarklet): Promise<void> {
  const db = await openDb()
  const record: StoredBookmarklet = { ...bookmarklet, searchTerms: computeSearchTerms(bookmarklet) }
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOOKMARKLETS_STORE, 'readwrite')
    transaction.objectStore(BOOKMARKLETS_STORE).put(JSON.parse(JSON.stringify(record)))
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

/** Insert or update a domain's cached favicon. */
async function saveFavicon(favicon: StoredFavicon): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FAVICONS_STORE, 'readwrite')
    transaction.objectStore(FAVICONS_STORE).put(favicon)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/** The cached favicon for `domain`, as a base64 data URL — undefined if none is cached. */
async function getFavicon(domain: string): Promise<string | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FAVICONS_STORE, 'readonly')
    const request = transaction.objectStore(FAVICONS_STORE).get(domain)
    request.onsuccess = () => resolve((request.result as StoredFavicon | undefined)?.dataUrl)
    request.onerror = () => reject(request.error)
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Returns the cached favicon for `domain` as a base64 data URL. If nothing's
 * cached yet and `liveFaviconUrl` is given (the browser's own resolved
 * favIconUrl for the tab, only meaningful when `domain` is the page
 * currently open), fetches and caches it. Undefined when there's nothing
 * cached and nothing fetchable — the caller falls back to a generic icon.
 */
export async function ensureFavicon(domain: string, liveFaviconUrl?: string): Promise<string | undefined> {
  const cached = await getFavicon(domain)
  if (cached) return cached
  if (!liveFaviconUrl) return undefined

  try {
    const response = await fetch(liveFaviconUrl)
    if (!response.ok) return undefined
    const dataUrl = await blobToDataUrl(await response.blob())
    await saveFavicon({ domain, dataUrl })
    return dataUrl
  } catch {
    return undefined
  }
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

/** All bookmarklet ids whose `searchTerms` index contains `term` — one direct indexed read. */
function getIdsForTerm(db: IDBDatabase, term: string): Promise<Set<string>> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOOKMARKLETS_STORE, 'readonly')
    const index = transaction.objectStore(BOOKMARKLETS_STORE).index(SEARCH_TERMS_INDEX)
    const request = index.getAllKeys(IDBKeyRange.only(term))
    request.onsuccess = () => resolve(new Set(request.result as string[]))
    request.onerror = () => reject(request.error)
  })
}

function intersect(a: Set<string>, b: Set<string>): Set<string> {
  const result = new Set<string>()
  for (const id of a) if (b.has(id)) result.add(id)
  return result
}

function getById(db: IDBDatabase, id: string): Promise<StoredBookmarklet | undefined> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOOKMARKLETS_STORE, 'readonly')
    const request = transaction.objectStore(BOOKMARKLETS_STORE).get(id)
    request.onsuccess = () => resolve(request.result as StoredBookmarklet | undefined)
    request.onerror = () => reject(request.error)
  })
}

export interface BookmarkletQuery {
  /** Terms that must ALL be present (AND) — ignored if empty. */
  all: string[]
  /** Terms where at least one must be present (OR) — ignored if empty. */
  any: string[]
}

/**
 * Queries the `searchTerms` index directly — never loads the store into memory. Each term is
 * one indexed key lookup (getAllKeys on an exact match); `all` intersects those id sets, `any`
 * unions its own set before being intersected in too. Only the ids that survive are fetched in
 * full. Cost scales with how many bookmarklets match each term, not with the store's total size.
 */
export async function queryBookmarklets(query: BookmarkletQuery): Promise<StoredBookmarklet[]> {
  const allTerms = Array.from(new Set(query.all.map((term) => term.toLowerCase().trim()).filter((term) => term !== '')))
  const anyTerms = Array.from(new Set(query.any.map((term) => term.toLowerCase().trim()).filter((term) => term !== '')))
  if (allTerms.length === 0 && anyTerms.length === 0) return []

  const db = await openDb()

  let ids: Set<string> | null = null
  for (const term of allTerms) {
    const termIds = await getIdsForTerm(db, term)
    ids = ids === null ? termIds : intersect(ids, termIds)
    if (ids.size === 0) return []
  }

  if (anyTerms.length > 0) {
    const groups = await Promise.all(anyTerms.map((term) => getIdsForTerm(db, term)))
    const union = new Set<string>()
    for (const group of groups) for (const id of group) union.add(id)
    ids = ids === null ? union : intersect(ids, union)
  }

  if (ids === null || ids.size === 0) return []

  const results = await Promise.all(Array.from(ids).map((id) => getById(db, id)))
  return results.filter((bookmarklet): bookmarklet is StoredBookmarklet => bookmarklet !== undefined)
}
