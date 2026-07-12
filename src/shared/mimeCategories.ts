/**
 * mimeCategories — textual format for editing NetworkConfig's mimeCategories in a plain
 * textarea: "## Name" starts a category, the non-empty lines under it are its mimetype
 * substrings, until the next "## " or end of text.
 */
import type { MimeCategoryRule } from './preferences'

export function serializeMimeCategories(rules: MimeCategoryRule[]): string {
  return rules.map((rule) => `## ${rule.name}\n${rule.mimeTypes.join('\n')}`).join('\n\n')
}

export function parseMimeCategories(text: string): MimeCategoryRule[] {
  const rules: MimeCategoryRule[] = []
  let current: MimeCategoryRule | null = null

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (line === '') continue

    if (line.startsWith('##')) {
      const name = line.slice(2).trim()
      if (name === '') continue
      current = { name, mimeTypes: [] }
      rules.push(current)
      continue
    }

    current?.mimeTypes.push(line)
  }

  return rules.filter((rule) => rule.mimeTypes.length > 0)
}

/**
 * One problem found in the raw text, everything parseMimeCategories silently drops or lets
 * through — surfaced so the UI can warn the user instead of quietly losing what they typed.
 */
export type MimeCategoriesIssue =
  | { type: 'unnamedHeader' }
  | { type: 'emptyCategory'; name: string }
  | { type: 'duplicateCategory'; name: string }
  | { type: 'strayLines' }
  | { type: 'noCategoriesFound' }

export function validateMimeCategoriesText(text: string): MimeCategoriesIssue[] {
  const issues: MimeCategoriesIssue[] = []
  const seenNames = new Set<string>()
  let current: { name: string; hasMimeTypes: boolean } | null = null
  let sawAnyHeader = false
  let sawStrayLine = false

  const closeCurrent = (): void => {
    if (current && !current.hasMimeTypes) issues.push({ type: 'emptyCategory', name: current.name })
  }

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (line === '') continue

    if (line.startsWith('##')) {
      closeCurrent()
      const name = line.slice(2).trim()
      if (name === '') {
        issues.push({ type: 'unnamedHeader' })
        current = null
        continue
      }
      const key = name.toLowerCase()
      if (seenNames.has(key)) issues.push({ type: 'duplicateCategory', name })
      seenNames.add(key)
      current = { name, hasMimeTypes: false }
      sawAnyHeader = true
      continue
    }

    if (current === null) {
      sawStrayLine = true
      continue
    }
    current.hasMimeTypes = true
  }
  closeCurrent()

  if (text.trim() !== '' && !sawAnyHeader) issues.push({ type: 'noCategoriesFound' })
  if (sawStrayLine) issues.push({ type: 'strayLines' })

  return issues
}
