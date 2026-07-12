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
