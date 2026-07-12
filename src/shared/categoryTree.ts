/**
 * categoryTree — turns the flat StoredCategory list into a nested tree by
 * reading "/" in the name as a path separator (e.g. "Work/Projects/2026").
 * No schema change: categories stay flat records: a name containing "/" is
 * just organized visually. Intermediate segments that don't match an actual
 * category (e.g. "Work" when only "Work/Projects" was ever created) become
 * structural nodes — grouping only, not selectable or deletable.
 */
import type { StoredCategory } from './bookmarkletsDb'

export interface CategoryTreeNode {
  segment: string
  fullPath: string
  category: StoredCategory | null
  children: CategoryTreeNode[]
}

/** The segments of a category name/path, trimmed and stripped of empties. */
function pathSegments(name: string): string[] {
  return name
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment !== '')
}

/**
 * Canonical form of a category name/path: consistent segment spacing, so
 * "AA/BB" and "AA / BB " (same path, sloppy typing) can't ever end up as two
 * separate category records. Must be applied before ever saving a category.
 */
export function normalizeCategoryName(name: string): string {
  return pathSegments(name).join('/')
}

export function buildCategoryTree(categories: StoredCategory[]): CategoryTreeNode[] {
  const roots: CategoryTreeNode[] = []
  const nodesByPath = new Map<string, CategoryTreeNode>()

  for (const category of categories) {
    const segments = pathSegments(category.name)
    if (segments.length === 0) continue

    let path = ''
    let siblings = roots
    let node: CategoryTreeNode | undefined
    for (const segment of segments) {
      path = path === '' ? segment : `${path}/${segment}`
      node = nodesByPath.get(path)
      if (!node) {
        node = { segment, fullPath: path, category: null, children: [] }
        nodesByPath.set(path, node)
        siblings.push(node)
      }
      siblings = node.children
    }
    if (node) node.category = category
  }

  return roots
}
