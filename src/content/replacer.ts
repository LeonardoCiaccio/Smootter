/**
 * replacer — "Smootters" optional service. Only ever injected when the user has enabled it in
 * Options (see replacerService.ts, which registers/unregisters this file as a dynamic content
 * script, not a static manifest entry, so disabled truly means nothing runs on any page).
 *
 * Watches every text-accepting element on the page (textareas, text inputs, contenteditable)
 * for a completed "/placeholder " word (typed by the user manually every keystroke, so it
 * naturally survives elements that come and go via DOM changes without any observer). When one
 * matches a saved snippet, it's swapped in for the placeholder, trailing space preserved.
 *
 * The lookup always goes to the background (see channel.ts's lookupReplacer handler), which
 * re-checks the Replacer preference on every single call this file never trusts its own
 * injected-ness as "enabled". That's what lets the user turn the service off and have it stop
 * acting immediately, without needing every open tab to reload first.
 *
 * Injected as a classic script (chrome.scripting.registerContentScripts) and built as its own
 * IIFE bundle (see vite.config.ts's content-script build pass): ES module output has no function
 * wrapper of its own, and when Chrome forces it to run as a classic script, its top-level
 * declarations land in the shared global scope of the page's isolated world where they can
 * collide with another independently-minified content script's same-named bindings. IIFE gives
 * this file its own scope. Importing from shared/ is safe here specifically because each
 * content-script build pass is single-entry (see vite.config.ts) with nothing else for Rollup
 * to split a shared chunk against unlike resumer.ts's original bug, from before that per-entry
 * pass split existed, where two entries in one multi-entry pass shared (and broke) a chunk.
 */
import { renderInlineMarkdown } from '@/shared/renderMarkdown'

// Deliberately excludes "password": expanding a saved snippet into a password field makes no
// sense and would be a bad place to have this feature ever active.
const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'url', 'tel'])
// A decent ceiling on how long a placeholder word can be before we stop considering it one
// guards against pathological cases (e.g. a huge pasted blob ending in "/something").
const MAX_PLACEHOLDER_LENGTH = 64

function isEditableTarget(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false
  if (target instanceof HTMLTextAreaElement) return true
  if (target instanceof HTMLInputElement) return TEXT_INPUT_TYPES.has(target.type)
  return target.isContentEditable
}

/** Plain text content of `el` up to the current caret position, however deep the caret is nested. */
function textBeforeCaret(el: HTMLElement): string {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.anchorNode === null) return ''
  const range = selection.getRangeAt(0).cloneRange()
  range.selectNodeContents(el)
  range.setEnd(selection.anchorNode, selection.anchorOffset)
  return range.toString()
}

/** The word immediately before `textBeforeSpace` (which excludes the space just typed). */
function lastWordOf(text: string): string {
  const match = /\S+$/.exec(text)
  return match ? match[0] : ''
}

function replaceInField(
  field: HTMLInputElement | HTMLTextAreaElement,
  wordStart: number,
  spaceIndex: number,
  replacement: string,
): void {
  // Plain `field.value = ...` doesn't notify a framework (React etc.) that owns this input as a
  // controlled component the native setter bypasses their own value-tracking wrapper, same
  // trick used to make a synthetic edit indistinguishable from a real one.
  const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
  const newValue = field.value.slice(0, wordStart) + replacement + field.value.slice(spaceIndex)
  if (nativeSetter) nativeSetter.call(field, newValue)
  else field.value = newValue

  const newCursor = wordStart + replacement.length + 1 // +1 to land after the preserved space
  field.setSelectionRange(newCursor, newCursor)
  field.dispatchEvent(new Event('input', { bubbles: true }))
}

function replaceInContentEditable(placeholder: string, replacement: string): void {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  // Extends the live selection backward, character by character, over the placeholder and the
  // space just typed, then replaces that selection execCommand fires the same input events a
  // real edit would, which is what most rich-text/contenteditable widgets listen for.
  const charsToRemove = placeholder.length + 1
  for (let i = 0; i < charsToRemove; i++) selection.modify('extend', 'backward', 'character')
  // Rich text here (Gmail, Slack, WhatsApp Web, ...) can actually render markdown, unlike a
  // plain input/textarea inline (not block) so **bold** expands without an unwanted paragraph
  // break. Sanitized: an imported replacer's text could be someone else's (see replacerTransfer.ts).
  document.execCommand('insertHTML', false, `${renderInlineMarkdown(replacement)} `)
}

function onLookupResult(
  target: HTMLElement,
  placeholder: string,
  wordStart: number,
  spaceIndex: number,
  response: { type?: string; text?: string | null } | undefined,
): void {
  if (response?.type !== 'lookupReplacerResult' || !response.text) return

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    replaceInField(target, wordStart, spaceIndex, response.text)
  } else {
    replaceInContentEditable(placeholder, response.text)
  }
}

function onInput(event: Event): void {
  // Only a just-typed space can complete a placeholder word triggering on every keystroke
  // would fire mid-word (wrong) and would also re-trigger on our own synthetic replacement
  // event below (its inserted text is never literally a single space).
  if ((event as InputEvent).data !== ' ') return

  const target = event.target
  if (!isEditableTarget(target)) return

  let textBeforeSpace: string
  let spaceIndex: number

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    spaceIndex = target.selectionStart ?? target.value.length
    textBeforeSpace = target.value.slice(0, spaceIndex - 1)
  } else {
    const before = textBeforeCaret(target)
    spaceIndex = before.length
    textBeforeSpace = before.slice(0, -1)
  }

  const word = lastWordOf(textBeforeSpace)
  if (!word.startsWith('/') || word.length < 2 || word.length > MAX_PLACEHOLDER_LENGTH) return
  const wordStart = spaceIndex - 1 - word.length

  void chrome.runtime
    .sendMessage({ type: 'lookupReplacer', placeholder: word })
    .then((response) => onLookupResult(target, word, wordStart, spaceIndex, response))
}

// Guards against replacer.js running inside Smootter's own environment iframe. Comparing origin
// parts directly (not string-prefixing a built URL, a lesson learned the hard way in resumer.ts).
function isSmootterOwnFrame(): boolean {
  return location.protocol === 'chrome-extension:' && location.hostname === chrome.runtime.id
}

function init(): void {
  if (isSmootterOwnFrame()) return
  document.addEventListener('input', onInput, { capture: true })
}

init()

// Forces TS to treat this file as a module (its own scope) instead of a global script: without
// any import/export, the type-checker merges every such content script's top-level names into
// one shared global scope, so two files declaring the same function name (e.g. init()) collide
// at type-check time even though each is built and injected as a fully separate bundle.
export {}
