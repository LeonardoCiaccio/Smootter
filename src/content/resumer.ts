/**
 * resumer — "Smootters" optional service. Only ever injected when the user has enabled it in
 * Options (see resumerService.ts, which registers/unregisters this file as a dynamic content
 * script, not a static manifest entry, so disabled truly means nothing runs on any page).
 *
 * Watches the page for article-like elements (including ones that appear later, e.g. after a
 * click in a single-page app) and shows a hover icon on them, bottom-right, only while the mouse
 * is over that element. Clicking it does exactly what the toolbar button and context menu already
 * do: open the environment (see openEnvironment.ts) at a route, except this route carries the
 * element's text as a base64 query param ("/chat?article=<b64>"). The background just opens that
 * route; ChatView.vue is what reads and consumes the param.
 *
 * Injected as a classic script (chrome.scripting.registerContentScripts) and built as its own
 * IIFE bundle (see vite.config.ts's content-script build pass): ES module output has no function
 * wrapper of its own, and when Chrome forces it to run as a classic script, its top-level
 * declarations land in the shared global scope of the page's isolated world where they can
 * collide with another independently-minified content script's (e.g. environment.js's) same-named
 * bindings. IIFE gives this file its own scope. Also never import runtime code from shared/: a
 * real import pulls in a second chunk that a dynamically-registered classic-script content script
 * can't load.
 */
const MARKER_ATTRIBUTE = 'data-smootter'

// Every kind of element we install the icon into. Keep this the single place that defines what
// "a target" is: matching logic and nesting checks below both read from it.
const TARGET_SELECTORS = 'article, #content'

// Same id environment.ts gives its modal. Never treat it (or anything inside it) as a target:
// two completely separate systems that must never react to each other's DOM.
const ENVIRONMENT_MODAL_ID = chrome.runtime.getManifest().short_name + '_environment_modal'

const ICON_SIZE = 32
const ICON_MARGIN = 8
const ICON_BOTTOM_MARGIN = 24
// Bridges the gap between "left the target" and "entered the icon" (they're not nested in the
// DOM, so a naive mouseleave/mouseenter pair would flicker-hide the icon before a click lands).
const HIDE_GRACE_MS = 150
// A decent cap on how much article text we ever hand to the LLM.
const MAX_ARTICLE_TEXT_LENGTH = 20000

const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT'])

// Hidden here: this button is never appended to the DOM itself, only cloned. Each clone flips
// display to visible on insertion.
const ICON_PROTOTYPE = ((): HTMLButtonElement => {
  const button = document.createElement('button')
  button.type = 'button'
  button.setAttribute('title', chrome.i18n.getMessage('resumerIconTitle'))
  button.style.cssText = `
    position: fixed !important;
    z-index: 2147483646 !important;
    width: ${ICON_SIZE}px !important;
    height: ${ICON_SIZE}px !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    display: none !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 9999px !important;
    background: #fff !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35) !important;
    cursor: pointer !important;
    border: none !important;
    padding: 4px !important;
  `

  const image = document.createElement('img')
  image.src = chrome.runtime.getURL('icons/icon-32.png')
  image.style.cssText =
    'width: 100% !important; height: 100% !important; display: block !important; pointer-events: none !important;'
  button.appendChild(image)

  return button
})()

let activeTarget: HTMLElement | null = null
let activeIcon: HTMLButtonElement | null = null
let hideTimer: ReturnType<typeof setTimeout> | undefined

function isWithinEnvironmentModal(element: Element): boolean {
  return element.closest(`#${ENVIRONMENT_MODAL_ID}`) != null
}

/** True if `element` nests, or is nested inside, another element we already govern. */
function isNestedWithTarget(element: Element): boolean {
  if (element.parentElement?.closest(TARGET_SELECTORS)) return true
  if (element.querySelector(TARGET_SELECTORS)) return true
  return false
}

/**
 * innerText/textContent never cross a shadow boundary — many sites render the actual article
 * body inside a web component's open shadow root, so reading the host element's innerText alone
 * returns next to nothing. This walks light DOM children and, whenever an element exposes an
 * open shadow root, its shadow children too, collecting real text either way.
 */
function extractText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const element = node as Element
  if (SKIPPED_TAGS.has(element.tagName)) return ''

  let text = ''
  if (element.shadowRoot) {
    for (const child of Array.from(element.shadowRoot.childNodes)) text += extractText(child) + ' '
  }
  for (const child of Array.from(element.childNodes)) text += extractText(child) + ' '
  return text
}

function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function showIcon(icon: HTMLButtonElement): void {
  icon.style.setProperty('display', 'flex', 'important')
}

function hideIcon(icon: HTMLButtonElement): void {
  icon.style.setProperty('display', 'none', 'important')
}

function cancelHide(): void {
  if (hideTimer === undefined) return
  clearTimeout(hideTimer)
  hideTimer = undefined
}

function scheduleHide(icon: HTMLButtonElement): void {
  cancelHide()
  hideTimer = setTimeout(() => {
    hideIcon(icon)
    activeTarget = null
    activeIcon = null
  }, HIDE_GRACE_MS)
}

/** Positions the icon at the bottom-right of the target's on-screen (viewport-clamped) area. */
function positionIcon(target: HTMLElement, icon: HTMLButtonElement): void {
  const rect = target.getBoundingClientRect()
  const visible =
    rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth
  if (!visible) {
    hideIcon(icon)
    return
  }
  const top = Math.min(
    Math.max(rect.bottom - ICON_SIZE - ICON_BOTTOM_MARGIN, ICON_MARGIN),
    window.innerHeight - ICON_SIZE - ICON_BOTTOM_MARGIN,
  )
  const left = Math.min(rect.right - ICON_SIZE - ICON_MARGIN, window.innerWidth - ICON_SIZE - ICON_MARGIN)
  icon.style.top = `${top}px`
  icon.style.left = `${left}px`
  showIcon(icon)
}

function onIconClick(target: HTMLElement, icon: HTMLButtonElement): void {
  const text = extractText(target).replace(/\s+/g, ' ').trim().slice(0, MAX_ARTICLE_TEXT_LENGTH)
  hideIcon(icon)
  activeTarget = null
  activeIcon = null
  const route = `/chat?article=${encodeURIComponent(encodeBase64(text))}`
  void chrome.runtime.sendMessage({ type: 'openResumerChat', route })
}

function insertIconIntoTargets(): void {
  document.querySelectorAll(`:is(${TARGET_SELECTORS}):not([${MARKER_ATTRIBUTE}])`).forEach((element) => {
    if (isWithinEnvironmentModal(element)) return
    if (isNestedWithTarget(element)) return
    element.setAttribute(MARKER_ATTRIBUTE, '')

    const target = element as HTMLElement
    const icon = ICON_PROTOTYPE.cloneNode(true) as HTMLButtonElement
    target.appendChild(icon)

    target.addEventListener('mouseenter', () => {
      cancelHide()
      activeTarget = target
      activeIcon = icon
      positionIcon(target, icon)
    })
    target.addEventListener('mouseleave', () => scheduleHide(icon))
    icon.addEventListener('mouseenter', cancelHide)
    icon.addEventListener('mouseleave', () => scheduleHide(icon))
    icon.addEventListener('click', () => onIconClick(target, icon))
  })
}

function onViewportChange(): void {
  if (!activeTarget || !activeIcon) return
  positionIcon(activeTarget, activeIcon)
}

// Per the reference pattern (SO 46428962): a MutationObserver that only reacts when
// document.location.href actually changed, not on every DOM mutation. Catches SPA navigations
// (pushState/replaceState/back-forward) without the false triggers a general "any mutation"
// observer produces when reacting to unrelated page churn.
function observeUrlChange(): void {
  let oldHref = document.location.href
  const observer = new MutationObserver(() => {
    if (oldHref === document.location.href) return
    oldHref = document.location.href
    insertIconIntoTargets()
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

/** Catches content that appears later without a URL change (e.g. "load more" clicks). */
function observeNewContent(): void {
  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((mutation) => !isWithinEnvironmentModal(mutation.target as Element))
    if (relevant) insertIconIntoTargets()
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

// Guards against resumer.js running inside Smootter's own environment iframe. Comparing origin
// parts directly (not string-prefixing a built URL, which silently failed to catch it).
function isSmootterOwnFrame(): boolean {
  return location.protocol === 'chrome-extension:' && location.hostname === chrome.runtime.id
}

function init(): void {
  if (isSmootterOwnFrame()) return
  insertIconIntoTargets()
  observeNewContent()
  observeUrlChange()
  window.addEventListener('scroll', onViewportChange, { capture: true, passive: true })
  window.addEventListener('resize', onViewportChange)
}

init()
