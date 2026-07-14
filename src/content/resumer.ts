/**
 * resumer — TEMP minimal build. Installs the icon button only, no observers, no listeners,
 * no logic at all. Isolating pure DOM installation before anything else is added back.
 */
function buildIconPrototype(): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.setAttribute('title', chrome.i18n.getMessage('resumerIconTitle'))
  // Hidden here: this button is never appended to the DOM itself, only cloned. Each clone
  // flips display to visible on insertion.
  button.style.cssText = `
    position: fixed !important;
    z-index: 2147483646 !important;
    width: 32px !important;
    height: 32px !important;
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
    bottom: 24px !important;
    right: 24px !important;
  `

  const image = document.createElement('img')
  image.src = chrome.runtime.getURL('icons/icon-32.png')
  image.style.cssText =
    'width: 100% !important; height: 100% !important; display: block !important; pointer-events: none !important;'
  button.appendChild(image)

  return button
}

const iconPrototype = buildIconPrototype()

const MARKER_ATTRIBUTE = 'data-smootter'

function insertIconIntoArticles(): void {
  document.querySelectorAll(`article:not([${MARKER_ATTRIBUTE}])`).forEach((article) => {
    article.setAttribute(MARKER_ATTRIBUTE, '')
    const clone = iconPrototype.cloneNode(true) as HTMLButtonElement
    clone.style.setProperty('display', 'flex', 'important')
    clone.addEventListener('click', () => {
      const parentArticle = clone.closest('article')
      alert(`Caratteri: ${parentArticle?.textContent?.length ?? 0}`)
    })
    article.appendChild(clone)
  })
}

function init(): void {
  console.log('[Smootter Resumer] init() called at', new Date().toISOString())
  insertIconIntoArticles()
}

init()
