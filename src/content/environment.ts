/**
 * environment — injected on demand. Runs in the page.
 * Test: mount a full-screen modal above the page (highest z-index + 10),
 * with a close button. Clicking the toolbar icon again re-opens it.
 */

import type { ChannelRequest, ChannelResponse } from '@/shared/messages'

// Injected in the isolated world (executeScript), so chrome.* is available.
// Injected as a classic script → must stay self-contained (no runtime imports).
const modalId = chrome.runtime.getManifest().short_name + '_environment_modal'

// Mirrors RUNTIME_PORT_NAME in messages.ts (kept local to avoid a runtime import)
const PORT_NAME = chrome.runtime.getManifest().short_name + '_runtime'

type Theme = 'light' | 'dark'

// Two modal styles: backdrop + icon color per theme
const modalStyles: Record<Theme, { backdrop: string; icon: string }> = {
  light: { backdrop: 'rgba(255, 255, 255, 0.9)', icon: '#000' },
  dark: { backdrop: 'rgba(0, 0, 0, 0.9)', icon: '#fff' },
}

// Persistent channel to the background (hub)
let port: chrome.runtime.Port | undefined

/** Apply a theme to the modal backdrop. */
function applyModalTheme(theme: Theme): void {
  const modal = document.getElementById(modalId)
  if (!modal) return
  const style = modalStyles[theme]
  modal.style.backgroundColor = style.backdrop
  modal.querySelectorAll('button').forEach((button) => (button.style.color = style.icon))
}

/** Handle a reply from the background. */
function handleWorkerMessage(message: ChannelResponse): void {
  if (message.type === 'preferenceResult' && message.ok && message.value) {
    applyModalTheme(message.value)
  }
}

/** Open the channel once and attach the reply handler. */
function ensurePort(): chrome.runtime.Port {
  if (!port) {
    port = chrome.runtime.connect({ name: PORT_NAME })
    port.onMessage.addListener(handleWorkerMessage)
  }
  return port
}

/** Send a message to the background over the channel. */
function sendToWorker(message: ChannelRequest): void {
  ensurePort().postMessage(message)
}

// Extension page loaded inside the iframe
const iframeUrl = chrome.runtime.getURL('src/iframe/index.html')

// Heroicons x-mark (24 outline)
const closeIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:100%;height:100%"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>'

// Heroicons moon (24 outline)
const moonIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:100%;height:100%"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/></svg>'

// Heroicons sun (24 outline)
const sunIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:100%;height:100%"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/></svg>'

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

/** Show an existing modal. */
function showModal(modal: HTMLElement): void {
  modal.style.display = ''
}

/** Apply the shared icon-button styles. */
function styleIconButton(button: HTMLButtonElement): void {
  button.style.position = 'absolute'
  button.style.top = '16px'
  button.style.width = '24px'
  button.style.height = '24px'
  button.style.padding = '0'
  button.style.border = 'none'
  button.style.background = 'transparent'
  button.style.cursor = 'pointer'
}

/** Build the top-right close button. */
function buildCloseButton(): HTMLButtonElement {
  const button = document.createElement('button')
  button.innerHTML = closeIcon
  styleIconButton(button)
  button.style.right = '20px'
  button.style.top = '20px'
  button.addEventListener('click', hideModal)
  return button
}

/** Build the theme toggle button: swaps icon and persists the theme preference. */
function buildThemeButton(): HTMLButtonElement {
  const button = document.createElement('button')
  // Modal defaults to dark → show the "switch to light" (sun) icon
  button.innerHTML = sunIcon
  styleIconButton(button)
  button.style.left = '20px'
  button.style.top = '20px'
  let dark = true
  button.addEventListener('click', () => {
    dark = !dark
    button.innerHTML = dark ? sunIcon : moonIcon
    const theme: Theme = dark ? 'dark' : 'light'
    applyModalTheme(theme)
    sendToWorker({ type: 'setPreference', key: 'theme', value: theme })
  })
  return button
}

/** Build the iframe hosting the extension page. */
function createIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe')
  iframe.src = iframeUrl
  iframe.style.position = 'absolute'
  iframe.style.top = '50%'
  iframe.style.left = '50%'
  iframe.style.transform = 'translate(-50%, -50%)'
  iframe.style.width = '420px'
  iframe.style.height = '600px'
  iframe.style.maxWidth = '90%'
  iframe.style.maxHeight = '90%'
  iframe.style.border = 'none'
  iframe.style.borderRadius = '12px'
  iframe.style.background = '#fff'
  return iframe
}

/** Create the modal at the given z-index. */
function createModal(zIndex: number): void {
  const modal = document.createElement('div')
  modal.id = modalId
  modal.style.position = 'fixed'
  modal.style.inset = '0'
  modal.style.zIndex = String(zIndex)
  modal.style.padding = '50px'
  modal.appendChild(createIframe())
  modal.appendChild(buildThemeButton())
  modal.appendChild(buildCloseButton())
  document.body.appendChild(modal)
  applyModalTheme('dark')
}

/** Open the modal: create it, or re-show it if already present. */
function openModal(): void {
  const existing = document.getElementById(modalId)

  if (!existing) return createModal(getMaxZIndex() + 10)

  if (existing.style.display === 'none') {
    showModal(existing)
  } else {
    hideModal()
  }
}

/** Open the modal and load the stored theme. */
function start(): void {
  openModal()
  sendToWorker({ type: 'getPreference', key: 'theme' })
}

if (document.readyState === 'complete') {
  start()
} else {
  window.addEventListener('load', start, { once: true })
}
