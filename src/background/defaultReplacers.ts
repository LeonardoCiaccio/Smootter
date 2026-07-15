/**
 * defaultReplacers built-in example replacers, seeded once on fresh install, same pattern as
 * defaultTools.ts: fed through the same import path a manual import uses (parseReplacersValue +
 * saveImportedReplacers), so seeding behaves exactly like the user importing this file
 * themselves. Editable and deletable like any other replacer; never re-added afterward (seeding
 * only runs on chrome.runtime.onInstalled reason 'install').
 */
import { parseReplacersValue, saveImportedReplacers } from '@/shared/replacerTransfer'
import type { StoredReplacer, StoredReplacerCategory } from '@/shared/replacerDb'
import defaultReplacersRaw from './defaultReplacers.json?raw'

/** Seeds the built-in example replacers. Only ever called on a fresh install. */
export async function seedDefaultReplacers(): Promise<void> {
  const candidates = parseReplacersValue(JSON.parse(defaultReplacersRaw))
  const categoryCache = new Map<string, StoredReplacerCategory>()
  const replacersByPlaceholder = new Map<string, StoredReplacer>()
  await saveImportedReplacers(candidates, categoryCache, replacersByPlaceholder)
}
