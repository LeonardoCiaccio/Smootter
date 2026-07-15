/**
 * replacerTransfer export replacers to JSON and import them back, mirroring
 * bookmarkletsTransfer.ts's shape (parsing/normalizing only, saving left to the caller see
 * exportImport.ts, which combines every section into the app's two general export/import
 * actions). The category travels as its name, not its internal id ids are local to each
 * user's DB and meaningless on import, so a matching (or new) category is resolved by name
 * instead, same as everywhere else categories are created on the fly. `placeholder` is the
 * import key (the trigger word is meant to be unique per user): an entry whose placeholder
 * matches an already-saved replacer updates it in place.
 */
import {
  saveReplacer,
  saveReplacerCategory,
  UNCATEGORIZED_REPLACER_CATEGORY_ID,
  type StoredReplacer,
  type StoredReplacerCategory,
} from './replacerDb'
import { normalizeCategoryName } from './categoryTree'

export interface ExportedReplacer {
  title: string
  placeholder: string
  text: string
  tags: string[]
  category: string
  createdAt: number
  updatedAt: number
}

export function replacerToExportable(
  replacer: StoredReplacer,
  categories: StoredReplacerCategory[],
): ExportedReplacer {
  return {
    title: replacer.title,
    placeholder: replacer.placeholder,
    text: replacer.text,
    tags: replacer.tags,
    category: categories.find((category) => category.id === replacer.categoryId)?.name ?? '',
    createdAt: replacer.createdAt,
    updatedAt: replacer.updatedAt,
  }
}

export type ReplacerImportCandidate = Partial<ExportedReplacer> & { placeholder: string }
type ImportCandidate = ReplacerImportCandidate

function isImportCandidate(value: unknown): value is ImportCandidate {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.placeholder === 'string' && record.placeholder.trim() !== ''
}

/** Normalizes an already-JSON.parsed value as either a single replacer or a collection. */
export function parseReplacersValue(parsed: unknown): ImportCandidate[] {
  const candidates = Array.isArray(parsed) ? parsed : [parsed]
  const valid = candidates.filter(isImportCandidate)
  if (valid.length === 0) throw new Error('invalidShape')
  return valid
}

/**
 * Resolves a category by (normalized) name, creating it if it doesn't exist yet. `cache` is
 * shared across an entire import batch so a newly created category is reused for the next
 * entry instead of being created again.
 */
async function resolveCategoryId(
  name: string | undefined,
  cache: Map<string, StoredReplacerCategory>,
): Promise<string> {
  const normalized = normalizeCategoryName(name ?? '')
  if (normalized === '') return UNCATEGORIZED_REPLACER_CATEGORY_ID

  const cached = cache.get(normalized)
  if (cached) return cached.id

  const category: StoredReplacerCategory = { id: crypto.randomUUID(), name: normalized }
  await saveReplacerCategory(category)
  cache.set(normalized, category)
  return category.id
}

/**
 * Saves a batch of parsed candidates, upserting by placeholder. `categoryCache` and
 * `replacersByPlaceholder` are shared across an entire import batch (possibly several files) so
 * state stays consistent across all of them e.g. two entries in different files naming the
 * same new category share one record, and a later file can still update an entry an earlier
 * file just created.
 */
export async function saveImportedReplacers(
  candidates: ImportCandidate[],
  categoryCache: Map<string, StoredReplacerCategory>,
  replacersByPlaceholder: Map<string, StoredReplacer>,
): Promise<number> {
  let count = 0
  for (const candidate of candidates) {
    // saveReplacer() lowercases the placeholder before persisting matching that here keeps
    // this function's own "already seen in this batch" map (and the existing-record lookup)
    // consistent with what's actually in the database.
    const placeholder = candidate.placeholder.toLowerCase()
    const categoryId = await resolveCategoryId(candidate.category, categoryCache)
    const existing = replacersByPlaceholder.get(placeholder)
    const now = Date.now()

    const replacer: StoredReplacer = {
      id: existing?.id ?? crypto.randomUUID(),
      title:
        typeof candidate.title === 'string' && candidate.title.trim() !== ''
          ? candidate.title
          : candidate.placeholder,
      placeholder,
      text: typeof candidate.text === 'string' ? candidate.text : '',
      tags: Array.isArray(candidate.tags)
        ? candidate.tags.filter((tag): tag is string => typeof tag === 'string')
        : [],
      categoryId,
      createdAt: existing?.createdAt ?? candidate.createdAt ?? now,
      updatedAt: now,
      // saveReplacer() always recomputes this from the other fields never trust an import.
      searchTerms: [],
    }
    await saveReplacer(replacer)
    replacersByPlaceholder.set(replacer.placeholder, replacer)
    count++
  }
  return count
}
