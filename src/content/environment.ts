/**
 * environment — injected on demand, once per toolbar click (isolated world).
 * Creates a full-screen modal hosting the SaaS iframe. All UI (toolbar,
 * theme, footer) now lives inside the iframe (single Vue app, single source
 * of truth for theme). This script only manages the modal shell and relays
 * the close signal, since the iframe can't reach the host page's DOM to
 * close its own container.
 *
 * Injected as a classic script → must stay self-contained (no runtime imports).
 * The DOM is the single source of truth for state (survives re-injections).
 */
import type { ChannelResponse } from '@/shared/messages'

const modalId = chrome.runtime.getManifest().short_name + '_environment_modal'
const iframeUrl = chrome.runtime.getURL('src/iframe/index.html')

// ---- Presence: is the modal in the DOM? ----
function getModal(): HTMLElement | null {
  return document.getElementById(modalId)
}

function isPresent(): boolean {
  return getModal() !== null
}

// ---- Visibility: is the modal shown or hidden? ----
function isVisible(): boolean {
  const modal = getModal()
  return modal !== null && modal.style.display !== 'none'
}

// ---- Host page scroll lock: hidden while the modal is visible ----
let previousHostOverflow = ''
let isHostScrollLocked = false

function lockHostScroll(): void {
  if (isHostScrollLocked) return
  previousHostOverflow = document.documentElement.style.overflow
  document.documentElement.style.overflow = 'hidden'
  isHostScrollLocked = true
}

function unlockHostScroll(): void {
  if (!isHostScrollLocked) return
  document.documentElement.style.overflow = previousHostOverflow
  isHostScrollLocked = false
}

function show(): void {
  const modal = getModal()
  if (!modal) return
  modal.style.display = ''
  lockHostScroll()
}

function hide(): void {
  const modal = getModal()
  if (!modal) return
  modal.style.display = 'none'
  unlockHostScroll()
}

// ---- Channel: listen for the iframe's close request (broadcast from the worker) ----
function handleWorkerMessage(message: ChannelResponse): void {
  if (message.type === 'closeModal') hide()
}

function connectChannel(): void {
  chrome.runtime.onMessage.addListener(handleWorkerMessage)
}

// ---- Build ----
function getMaxZIndex(): number {
  let max = 999999999
  for (const el of document.querySelectorAll('*')) {
    const value = Number.parseInt(getComputedStyle(el).zIndex, 10)
    if (Number.isFinite(value) && value > max) max = value
  }
  return max
}

function buildIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe')
  iframe.src = iframeUrl
  iframe.style.display = 'block'
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.border = 'none'
  return iframe
}

function createModal(): void {
  const modal = document.createElement('div')
  modal.id = modalId
  modal.style.position = 'fixed'
  modal.style.inset = '0'
  modal.style.zIndex = String(getMaxZIndex() + 10)
  modal.appendChild(buildIframe())
  document.body.appendChild(modal)
  lockHostScroll()
}

// ---- Controller: handle one toolbar click (one injection) ----
function handleToolbarClick(): void {
  if (!isPresent()) {
    createModal()
    return
  }
  if (isVisible()) hide()
  else show()
}

connectChannel()
handleToolbarClick()
