/**
 * environment — injected on demand. Runs in the page.
 * Test: mount a full-screen modal above the page (highest z-index + 10),
 * with a close button. Clicking the toolbar icon again re-opens it.
 */

// Injected in the isolated world (executeScript), so chrome.* is available
const modalId = chrome.runtime.getManifest().short_name + '_environment_modal'

// Heroicons x-mark (24 outline)
const closeIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:100%;height:100%"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>'

/** Read the highest numeric z-index among all elements in the page. */
function getMaxZIndex(): number {
  let max = 0
  for (const el of document.querySelectorAll('*')) {
    const value = Number.parseInt(getComputedStyle(el).zIndex, 10)
    if (Number.isFinite(value) && value > max) max = value
  }
  return max
}

/** Hide the modal. */
function hideModal(): void {
  const modal = document.getElementById(modalId)
  if (modal) modal.style.display = 'none'
}

/** Build the top-right close button. */
function buildCloseButton(): HTMLButtonElement {
  const button = document.createElement('button')
  button.innerHTML = closeIcon
  button.style.position = 'absolute'
  button.style.top = '16px'
  button.style.right = '16px'
  button.style.width = '32px'
  button.style.height = '32px'
  button.style.padding = '0'
  button.style.border = 'none'
  button.style.background = 'transparent'
  button.style.color = '#fff'
  button.style.cursor = 'pointer'
  button.addEventListener('click', hideModal)
  return button
}

/** Create the modal at the given z-index. */
function createModal(zIndex: number): void {
  const modal = document.createElement('div')
  modal.id = modalId
  modal.style.position = 'fixed'
  modal.style.inset = '0'
  modal.style.zIndex = String(zIndex)
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'
  modal.appendChild(buildCloseButton())
  document.body.appendChild(modal)
}

/** Open the modal: create it, or re-show it if already present. */
function openModal(): void {
  const existing = document.getElementById(modalId)
  if (existing) {
    existing.style.display = ''
    return
  }
  createModal(getMaxZIndex() + 10)
}

if (document.readyState === 'complete') {
  openModal()
} else {
  window.addEventListener('load', openModal, { once: true })
}
