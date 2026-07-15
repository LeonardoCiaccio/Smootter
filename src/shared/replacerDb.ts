/**
 * replacerDb IndexedDB-backed storage for saved text-expansion snippets and their categories.
 * Separate database from bookmarkletsDb/toolsDb: different entity, different lifecycle, no
 * reason to share a store.
 */

export interface StoredReplacer {
  id: string
  title: string
  // Trigger word the replacer service watches for (e.g. "/casa"), replaced with `text` once
  // the user types a space right after it.
  placeholder: string
  text: string
  tags: string[]
  categoryId: string
  createdAt: number
  updatedAt: number
  // Lowercased, deduplicated words from title + placeholder + text + tags recomputed on every
  // save, indexed (multiEntry) so the AI search tool can query the DB directly by term instead
  // of loading every replacer into memory. See queryReplacers.
  searchTerms: string[]
}

export interface StoredReplacerCategory {
  id: string
  name: string
}

/** Always present, never deletable the catch-all category replacers fall back to. */
export const UNCATEGORIZED_REPLACER_CATEGORY_ID = 'uncategorized'

const DB_NAME = chrome.runtime.getManifest().short_name + '_replacer'
const DB_VERSION = 3
const REPLACERS_STORE = 'replacers'
const CATEGORIES_STORE = 'categories'
const SEARCH_TERMS_INDEX = 'searchTerms'
const PLACEHOLDER_INDEX = 'placeholder'

/** Lowercased, deduplicated words splits on anything that isn't a letter or digit. */
function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .filter((word) => word !== ''),
    ),
  )
}

function computeSearchTerms(
  replacer: Pick<StoredReplacer, 'title' | 'placeholder' | 'text' | 'tags'>,
): string[] {
  return tokenize([replacer.title, replacer.placeholder, replacer.text, replacer.tags.join(' ')].join(' '))
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = request.result
      if (!db.objectStoreNames.contains(REPLACERS_STORE)) {
        db.createObjectStore(REPLACERS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(CATEGORIES_STORE)) {
        db.createObjectStore(CATEGORIES_STORE, { keyPath: 'id' })
      }

      // request.transaction is the versionchange transaction spans every store above, even
      // ones just created this same upgrade.
      const replacersStore = request.transaction!.objectStore(REPLACERS_STORE)
      if (!replacersStore.indexNames.contains(SEARCH_TERMS_INDEX)) {
        replacersStore.createIndex(SEARCH_TERMS_INDEX, SEARCH_TERMS_INDEX, { multiEntry: true })
      }
      // Exact-match lookup for the injected replacer.ts content script (see
      // getReplacerByPlaceholder) not multiEntry: one placeholder maps to one record.
      if (!replacersStore.indexNames.contains(PLACEHOLDER_INDEX)) {
        replacersStore.createIndex(PLACEHOLDER_INDEX, PLACEHOLDER_INDEX)
      }

      // Records saved before this field existed have none backfill them here, in the same
      // transaction, so nothing goes unsearchable until it happens to be edited again.
      if (event.oldVersion < 2) {
        replacersStore.openCursor().onsuccess = (cursorEvent) => {
          const cursor = (cursorEvent.target as IDBRequest<IDBCursorWithValue | null>).result
          if (!cursor) return
          const replacer = cursor.value as StoredReplacer
          cursor.update({ ...replacer, searchTerms: computeSearchTerms(replacer) })
          cursor.continue()
        }
      }
    }
    request.onsuccess = () => {
      const db = request.result
      // Background and UI (iframe) each open this same database independently. Without this,
      // whichever one opened first would block the other's future version bump forever an
      // open connection at the old version prevents onupgradeneeded from ever running elsewhere.
      db.onversionchange = () => db.close()
      resolve(db)
    }
    request.onerror = () => reject(request.error)
  })
}

/** Insert or update a replacer. `searchTerms` is always recomputed here never trust the caller's copy. */
export async function saveReplacer(replacer: StoredReplacer): Promise<void> {
  const db = await openDb()
  const record: StoredReplacer = { ...replacer, searchTerms: computeSearchTerms(replacer) }
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(REPLACERS_STORE, 'readwrite')
    transaction.objectStore(REPLACERS_STORE).put(JSON.parse(JSON.stringify(record)))
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/** All saved replacers. */
export async function getAllReplacers(): Promise<StoredReplacer[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(REPLACERS_STORE, 'readonly')
    const request = transaction.objectStore(REPLACERS_STORE).getAll()
    request.onsuccess = () => resolve(request.result as StoredReplacer[])
    request.onerror = () => reject(request.error)
  })
}

/**
 * Reassigns any replacer whose categoryId doesn't match a known category (stale data, or a
 * category deleted through some other path) to the fixed "uncategorized" category, persisting
 * the fix. Called on load so these can't accumulate as ghost records invisible to the sidebar.
 * Returns the corrected list.
 */
export async function reconcileOrphanReplacers(
  categories: StoredReplacerCategory[],
): Promise<StoredReplacer[]> {
  const knownCategoryIds = new Set(categories.map((category) => category.id))
  const all = await getAllReplacers()
  const now = Date.now()
  const fixed = all.map((replacer) =>
    knownCategoryIds.has(replacer.categoryId)
      ? replacer
      : { ...replacer, categoryId: UNCATEGORIZED_REPLACER_CATEGORY_ID, updatedAt: now },
  )
  await Promise.all(
    fixed.filter((replacer, index) => replacer !== all[index]).map((replacer) => saveReplacer(replacer)),
  )
  return fixed
}

/** Remove a replacer by id. */
export async function deleteReplacer(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(REPLACERS_STORE, 'readwrite')
    transaction.objectStore(REPLACERS_STORE).delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/** Strips `tag` from every replacer that has it. Returns the updated replacers. */
export async function deleteReplacerTagEverywhere(tag: string): Promise<StoredReplacer[]> {
  const all = await getAllReplacers()
  const now = Date.now()
  const updated = all.map((replacer) =>
    replacer.tags.includes(tag)
      ? { ...replacer, tags: replacer.tags.filter((existing) => existing !== tag), updatedAt: now }
      : replacer,
  )
  await Promise.all(
    updated.filter((replacer, index) => replacer !== all[index]).map((replacer) => saveReplacer(replacer)),
  )
  return updated
}

/** Insert or update a category. */
export async function saveReplacerCategory(category: StoredReplacerCategory): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CATEGORIES_STORE, 'readwrite')
    transaction.objectStore(CATEGORIES_STORE).put(JSON.parse(JSON.stringify(category)))
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/** Seeds the fixed "uncategorized" category the first time it's missing. */
async function ensureUncategorizedReplacerCategory(
  categories: StoredReplacerCategory[],
): Promise<StoredReplacerCategory[]> {
  if (categories.some((category) => category.id === UNCATEGORIZED_REPLACER_CATEGORY_ID)) return categories

  const uncategorized: StoredReplacerCategory = {
    id: UNCATEGORIZED_REPLACER_CATEGORY_ID,
    name: chrome.i18n.getMessage('bookmarkletsUncategorized'),
  }
  await saveReplacerCategory(uncategorized)
  return [uncategorized, ...categories]
}

/** All saved categories always includes the fixed "uncategorized" one, seeding it if needed. */
export async function getAllReplacerCategories(): Promise<StoredReplacerCategory[]> {
  const db = await openDb()
  const categories = await new Promise<StoredReplacerCategory[]>((resolve, reject) => {
    const transaction = db.transaction(CATEGORIES_STORE, 'readonly')
    const request = transaction.objectStore(CATEGORIES_STORE).getAll()
    request.onsuccess = () => resolve(request.result as StoredReplacerCategory[])
    request.onerror = () => reject(request.error)
  })
  return ensureUncategorizedReplacerCategory(categories)
}

/**
 * Removes a category (the fixed "uncategorized" one can't be deleted a no-op). Replacers that
 * were in it fall back to "uncategorized" rather than being deleted a category disappearing
 * shouldn't take its snippets with it. Returns the updated replacers.
 */
export async function deleteReplacerCategory(id: string): Promise<StoredReplacer[]> {
  if (id === UNCATEGORIZED_REPLACER_CATEGORY_ID) return getAllReplacers()

  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(CATEGORIES_STORE, 'readwrite')
    transaction.objectStore(CATEGORIES_STORE).delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })

  const all = await getAllReplacers()
  const now = Date.now()
  const updated = all.map((replacer) =>
    replacer.categoryId === id
      ? { ...replacer, categoryId: UNCATEGORIZED_REPLACER_CATEGORY_ID, updatedAt: now }
      : replacer,
  )
  await Promise.all(
    updated.filter((replacer, index) => replacer !== all[index]).map((replacer) => saveReplacer(replacer)),
  )
  return updated
}

/** All replacer ids whose `searchTerms` index contains `term` one direct indexed read. */
function getIdsForTerm(db: IDBDatabase, term: string): Promise<Set<string>> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(REPLACERS_STORE, 'readonly')
    const index = transaction.objectStore(REPLACERS_STORE).index(SEARCH_TERMS_INDEX)
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

function getById(db: IDBDatabase, id: string): Promise<StoredReplacer | undefined> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(REPLACERS_STORE, 'readonly')
    const request = transaction.objectStore(REPLACERS_STORE).get(id)
    request.onsuccess = () => resolve(request.result as StoredReplacer | undefined)
    request.onerror = () => reject(request.error)
  })
}

export interface ReplacerQuery {
  /** Terms that must ALL be present (AND) ignored if empty. */
  all: string[]
  /** Terms where at least one must be present (OR) ignored if empty. */
  any: string[]
}

/**
 * Queries the `searchTerms` index directly never loads the store into memory. Each term is
 * one indexed key lookup (getAllKeys on an exact match); `all` intersects those id sets, `any`
 * unions its own set before being intersected in too. Only the ids that survive are fetched in
 * full. Cost scales with how many replacers match each term, not with the store's total size.
 */
export async function queryReplacers(query: ReplacerQuery): Promise<StoredReplacer[]> {
  const allTerms = Array.from(
    new Set(query.all.map((term) => term.toLowerCase().trim()).filter((term) => term !== '')),
  )
  const anyTerms = Array.from(
    new Set(query.any.map((term) => term.toLowerCase().trim()).filter((term) => term !== '')),
  )
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
  return results.filter((replacer): replacer is StoredReplacer => replacer !== undefined)
}

/** Exact-match lookup by trigger word (e.g. "/casa") for the injected replacer.ts content script. */
export async function getReplacerByPlaceholder(placeholder: string): Promise<StoredReplacer | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(REPLACERS_STORE, 'readonly')
    const index = transaction.objectStore(REPLACERS_STORE).index(PLACEHOLDER_INDEX)
    const request = index.get(placeholder)
    request.onsuccess = () => resolve(request.result as StoredReplacer | undefined)
    request.onerror = () => reject(request.error)
  })
}
