/**
 * defaultTools built-in example tools, seeded once on fresh install.
 * The seed source is a real export file (defaultTools.json, produced the same way
 * a user would export their own tools) fed through the exact same import path
 * (parseToolsText) as a manual import same base64 decoding, same defaults, same
 * "starts disabled" rule. Editable and deletable like any other tool; never re-added
 * afterward (seeding only runs on chrome.runtime.onInstalled reason 'install').
 */
import { saveTool } from '@/shared/toolsDb'
import { parseToolsText } from '@/shared/toolsTransfer'
import defaultToolsRaw from './defaultTools.json?raw'

/** Seeds the built-in example tools. Only ever called on a fresh install. */
export async function seedDefaultTools(): Promise<void> {
  const tools = parseToolsText(defaultToolsRaw)
  for (const tool of tools) await saveTool(tool)
}
