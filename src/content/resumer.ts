/**
 * resumer — "Smootters" optional service. Only ever injected when the user has enabled it in
 * Options (see resumerService.ts, which registers/unregisters this file entirely dynamic
 * content script registration, not a static manifest entry, so disabled truly means nothing
 * runs on any page).
 *
 * Watches the page for article-like elements (including ones that appear later, e.g. after a
 * click in a single-page app) and shows a small hover icon on them, bottom-right, only while the
 * mouse is over that article. Clicking it does exactly what the toolbar button and context menu
 * already do open the environment (see openEnvironment.ts) at a given route except the route
 * here carries the article's text as a base64 query param: "/chat?article=<b64>". The background
 * just opens that route; ChatView.vue is what reads and consumes the param.
 *
 * Injected as a classic script (chrome.scripting registerContentScripts), built as its own
 * single-file bundle (see vite.config.ts) never imports runtime code from shared/, only types
 * a real import would pull in a second chunk Chrome can't load as a plain content script.
 */

// Broad but simple on purpose the semantic <article> tag is what sites are supposed to use for
// this exact case. Widening this to class-based heuristics is a deliberate follow-up.
const ARTICLE_SELECTOR = 'article'

const ICON_SIZE = 32
const ICON_MARGIN = 8
const ICON_BOTTOM_MARGIN = 24
// Bridges the gap between "left the article" and "entered the icon" (they're not nested in the
// DOM, so a naive mouseleave/mouseenter pair would flicker-hide the icon before a click lands).
const HIDE_GRACE_MS = 150
const ICON_ID = 'smootter-resumer-icon'

const trackedArticles = new WeakSet<Element>()
let activeArticle: HTMLElement | null = null
let hideTimer: ReturnType<typeof setTimeout> | undefined

function buildIcon(): HTMLButtonElement {
  const button = document.createElement('button')
  button.id = ICON_ID
  button.type = 'button'
  button.setAttribute('title', chrome.i18n.getMessage('resumerIconTitle'))
  // No `all: initial` here on purpose: combined with later individual !important declarations
  // in the same inline style, it left `display` stuck at its CSS-initial value ("inline")
  // instead of picking up a later `display: flex/none !important` confirmed live via
  // getComputedStyle(). Resetting only the properties that actually matter avoids that.
  button.style.cssText = `
    position: fixed !important;
    z-index: 2147483647 !important;
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
  image.style.cssText = 'width: 100% !important; height: 100% !important; display: block !important; pointer-events: none !important;'
  button.appendChild(image)

  return button
}

const icon = buildIcon()

function showIcon(): void {
  icon.style.setProperty('display', 'flex', 'important')
}

function hideIcon(): void {
  icon.style.setProperty('display', 'none', 'important')
}

function cancelHide(): void {
  if (hideTimer !== undefined) {
    clearTimeout(hideTimer)
    hideTimer = undefined
  }
}

function scheduleHide(): void {
  cancelHide()
  hideTimer = setTimeout(() => {
    hideIcon()
    activeArticle = null
  }, HIDE_GRACE_MS)
}

/** Positions the icon at the bottom-right of the article's on-screen (viewport-clamped) area. */
function positionIcon(article: HTMLElement): void {
  const rect = article.getBoundingClientRect()
  const visible = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth
  if (!visible) {
    hideIcon()
    return
  }
  const top = Math.min(
    Math.max(rect.bottom - ICON_SIZE - ICON_BOTTOM_MARGIN, ICON_MARGIN),
    window.innerHeight - ICON_SIZE - ICON_BOTTOM_MARGIN,
  )
  const left = Math.min(rect.right - ICON_SIZE - ICON_MARGIN, window.innerWidth - ICON_SIZE - ICON_MARGIN)
  icon.style.top = `${top}px`
  icon.style.left = `${left}px`
  showIcon()
}

function onArticleEnter(article: HTMLElement): void {
  cancelHide()
  activeArticle = article
  positionIcon(article)
}

function onArticleLeave(): void {
  scheduleHide()
}

function onScroll(): void {
  if (activeArticle) positionIcon(activeArticle)
}

function onIconClick(): void {
  if (!activeArticle) return
  const text = (activeArticle.innerText ?? '').trim()
  const articleCount = document.querySelectorAll(ARTICLE_SELECTOR).length
  const preview = text.slice(0, 60)
  hideIcon()
  activeArticle = null

  // TEMP diagnostic: which element got captured, and how many <article>s exist on the page.
  alert(
    `Caratteri: ${Math.min(text.length, 1000)}\n` +
      `Tag articoli sulla pagina: ${articleCount}\n` +
      `Anteprima: "${preview}"`,
  )
}

function watchArticle(article: Element): void {
  if (trackedArticles.has(article)) return
  trackedArticles.add(article)
  article.addEventListener('mouseenter', () => onArticleEnter(article as HTMLElement))
  article.addEventListener('mouseleave', onArticleLeave)
}

function scanForArticles(): void {
  document.querySelectorAll(ARTICLE_SELECTOR).forEach(watchArticle)
}

function connectObservers(): void {
  const mutationObserver = new MutationObserver(() => scanForArticles())
  mutationObserver.observe(document.documentElement, { childList: true, subtree: true })

  window.addEventListener('scroll', onScroll, { capture: true, passive: true })
  window.addEventListener('resize', onScroll)

  // Per the reference pattern (SO 46428962): dispatches a synthetic 'locationchange' event so
  // SPA navigations (history.pushState/replaceState, back/forward) are observable a click that
  // swaps in a new article without a real page load still needs a fresh scan.
  const originalPushState = history.pushState.bind(history)
  const originalReplaceState = history.replaceState.bind(history)
  history.pushState = function (...args: Parameters<History['pushState']>) {
    originalPushState(...args)
    window.dispatchEvent(new Event('locationchange'))
  }
  history.replaceState = function (...args: Parameters<History['replaceState']>) {
    originalReplaceState(...args)
    window.dispatchEvent(new Event('locationchange'))
  }
  window.addEventListener('popstate', () => window.dispatchEvent(new Event('locationchange')))
  window.addEventListener('locationchange', scanForArticles)
}

function init(): void {
  if (document.getElementById(ICON_ID)) return

  icon.addEventListener('mouseenter', cancelHide)
  icon.addEventListener('mouseleave', onArticleLeave)
  icon.addEventListener('click', onIconClick)
  document.documentElement.appendChild(icon)

  connectObservers()
  scanForArticles()
}

init()
