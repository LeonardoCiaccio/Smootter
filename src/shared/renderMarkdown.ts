/**
 * Renders chat message text as sanitized HTML. Needed because resumer.ts can feed arbitrary
 * page content into the conversation an LLM reply built from untrusted page content is itself
 * untrusted, so the parsed markdown is run through DOMPurify before ever reaching v-html.
 */
import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ breaks: true })

export function renderMarkdown(text: string): string {
  const html = marked.parse(text, { async: false })
  return DOMPurify.sanitize(html)
}
