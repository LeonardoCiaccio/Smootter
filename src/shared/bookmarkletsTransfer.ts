/**
 * bookmarkletsTransfer — export bookmarklets to JSON and import them back, mirroring
 * toolsTransfer.ts's shape (parsing/normalizing only, saving left to the caller — see
 * exportImport.ts, which combines both into the app's two general export/import actions).
 * The category travels as its name, not its internal id — ids are local to each user's DB
 * and meaningless on import, so a matching (or new) category is resolved by name instead,
 * same as everywhere else categories are created on the fly. `url` is the import key: an
 * entry whose url matches an already-saved bookmarklet updates it in place — a url must
 * never end up duplicated across two records.
 */
import {
  saveBookmarklet,
  saveCategory,
  UNCATEGORIZED_CATEGORY_ID,
  type StoredBookmarklet,
  type StoredCategory,
} from './bookmarkletsDb'
import { normalizeCategoryName } from './categoryTree'

export interface ExportedBookmarklet {
  title: string
  url: string
  description: string
  tags: string[]
  category: string
  createdAt: number
  updatedAt: number
}

export function bookmarkletToExportable(bookmarklet: StoredBookmarklet, categories: StoredCategory[]): ExportedBookmarklet {
  return {
    title: bookmarklet.title,
    url: bookmarklet.url,
    description: bookmarklet.description,
    tags: bookmarklet.tags,
    category: categories.find((category) => category.id === bookmarklet.categoryId)?.name ?? '',
    createdAt: bookmarklet.createdAt,
    updatedAt: bookmarklet.updatedAt,
  }
}

export type BookmarkletImportCandidate = Partial<ExportedBookmarklet> & { url: string }
type ImportCandidate = BookmarkletImportCandidate

function isImportCandidate(value: unknown): value is ImportCandidate {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.url === 'string' && record.url.trim() !== ''
}

/** Normalizes an already-JSON.parsed value as either a single bookmarklet or a collection. */
export function parseBookmarkletsValue(parsed: unknown): ImportCandidate[] {
  const candidates = Array.isArray(parsed) ? parsed : [parsed]
  const valid = candidates.filter(isImportCandidate)
  if (valid.length === 0) throw new Error('invalidShape')
  return valid
}

/** Parses raw JSON text as either a single bookmarklet or a collection. */
export function parseBookmarkletsText(text: string): ImportCandidate[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('invalidJson')
  }
  return parseBookmarkletsValue(parsed)
}

/**
 * Resolves a category by (normalized) name, creating it if it doesn't exist yet. `cache` is
 * shared across an entire import batch so a newly created category is reused for the next
 * entry instead of being created again.
 */
async function resolveCategoryId(name: string | undefined, cache: Map<string, StoredCategory>): Promise<string> {
  const normalized = normalizeCategoryName(name ?? '')
  if (normalized === '') return UNCATEGORIZED_CATEGORY_ID

  const cached = cache.get(normalized)
  if (cached) return cached.id

  const category: StoredCategory = { id: crypto.randomUUID(), name: normalized }
  await saveCategory(category)
  cache.set(normalized, category)
  return category.id
}

/**
 * Saves a batch of parsed candidates, upserting by url. `categoryCache` and `bookmarkletsByUrl`
 * are shared across an entire import batch (possibly several files) so state stays consistent
 * across all of them — e.g. two entries in different files naming the same new category share
 * one record, and a later file can still update an entry an earlier file just created.
 */
export async function saveImportedBookmarklets(
  candidates: ImportCandidate[],
  categoryCache: Map<string, StoredCategory>,
  bookmarkletsByUrl: Map<string, StoredBookmarklet>,
): Promise<number> {
  let count = 0
  for (const candidate of candidates) {
    const categoryId = await resolveCategoryId(candidate.category, categoryCache)
    const existing = bookmarkletsByUrl.get(candidate.url)
    const now = Date.now()

    const bookmarklet: StoredBookmarklet = {
      id: existing?.id ?? crypto.randomUUID(),
      title: typeof candidate.title === 'string' && candidate.title.trim() !== '' ? candidate.title : candidate.url,
      url: candidate.url,
      description: typeof candidate.description === 'string' ? candidate.description : '',
      tags: Array.isArray(candidate.tags) ? candidate.tags.filter((tag): tag is string => typeof tag === 'string') : [],
      categoryId,
      createdAt: existing?.createdAt ?? candidate.createdAt ?? now,
      updatedAt: now,
    }
    await saveBookmarklet(bookmarklet)
    bookmarkletsByUrl.set(bookmarklet.url, bookmarklet)
    count++
  }
  return count
}
