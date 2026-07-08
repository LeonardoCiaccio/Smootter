/**
 * environment — injected on demand, once per toolbar click (isolated world).
 * Manages a full-screen modal hosting the extension iframe, with a theme toggle.
 *
 * Injected as a classic script → must stay self-contained (no runtime imports).
 * The DOM is the single source of truth for state (survives re-injections).
 */
import type { ChannelRequest, ChannelResponse } from '@/shared/messages'

// ---- Constants ----
const modalId = chrome.runtime.getManifest().short_name + '_environment_modal'
// Mirrors RUNTIME_PORT_NAME in messages.ts (kept local: no runtime import)
const portName = chrome.runtime.getManifest().short_name + '_runtime'
const iframeUrl = chrome.runtime.getURL('src/iframe/index.html')

type Theme = 'light' | 'dark'

const modalStyles: Record<Theme, { backdrop: string; icon: string }> = {
  light: { backdrop: 'rgba(255, 255, 255, 0.9)', icon: '#000' },
  dark: { backdrop: 'rgba(0, 0, 0, 0.9)', icon: '#fff' },
}

// Heroicons (24 outline)
const closeIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:100%;height:100%"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>'
const moonIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:100%;height:100%"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/></svg>'
const sunIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:100%;height:100%"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/></svg>'

// ---- Channel (to the background hub) ----
let port: chrome.runtime.Port | undefined
// The user toggled during load: ignore the late initial theme reply
let userChoseTheme = false

function handleWorkerMessage(message: ChannelResponse): void {
  if (message.type !== 'preferenceValue' || message.key !== 'theme') return
  if (userChoseTheme) return
  if (message.value) {
    applyTheme(message.value)
  } else {
    // No stored theme yet: initialize from the browser theme and persist
    const theme = detectBrowserTheme()
    applyTheme(theme)
    sendToWorker({ type: 'setPreference', key: 'theme', value: theme })
  }
}

function sendToWorker(message: ChannelRequest): void {
  if (!port) {
    port = chrome.runtime.connect({ name: portName })
    port.onMessage.addListener(handleWorkerMessage)
  }
  port.postMessage(message)
}

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

function show(): void {
  const modal = getModal()
  if (modal) modal.style.display = ''
}

function hide(): void {
  const modal = getModal()
  if (modal) modal.style.display = 'none'
}

// ---- Theme ----
function detectBrowserTheme(): Theme {
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function currentTheme(): Theme {
  return (getModal()?.dataset.theme as Theme | undefined) ?? 'dark'
}

function applyTheme(theme: Theme): void {
  const modal = getModal()
  if (!modal) return
  modal.dataset.theme = theme
  const style = modalStyles[theme]
  modal.style.backgroundColor = style.backdrop
  modal.querySelectorAll('button').forEach((button) => (button.style.color = style.icon))
  const themeButton = modal.querySelector<HTMLButtonElement>('[data-role="theme"]')
  if (themeButton) themeButton.innerHTML = theme === 'dark' ? sunIcon : moonIcon
}

function toggleTheme(): void {
  userChoseTheme = true
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  sendToWorker({ type: 'setPreference', key: 'theme', value: next })
}

// ---- Build ----
function getMaxZIndex(): number {
  let max = 0
  for (const el of document.querySelectorAll('*')) {
    const value = Number.parseInt(getComputedStyle(el).zIndex, 10)
    if (Number.isFinite(value) && value > max) max = value
  }
  return max
}

function styleIconButton(button: HTMLButtonElement): void {
  button.style.position = 'absolute'
  button.style.top = '20px'
  button.style.width = '24px'
  button.style.height = '24px'
  button.style.padding = '0'
  button.style.border = 'none'
  button.style.background = 'transparent'
  button.style.cursor = 'pointer'
}

function buildCloseButton(): HTMLButtonElement {
  const button = document.createElement('button')
  button.innerHTML = closeIcon
  styleIconButton(button)
  button.style.right = '20px'
  button.addEventListener('click', hide)
  return button
}

function buildThemeButton(): HTMLButtonElement {
  const button = document.createElement('button')
  button.dataset.role = 'theme'
  styleIconButton(button)
  button.style.left = '20px'
  button.addEventListener('click', toggleTheme)
  return button
}

function buildIframe(): HTMLIFrameElement {
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

function createModal(): void {
  const modal = document.createElement('div')
  modal.id = modalId
  modal.style.position = 'fixed'
  modal.style.inset = '0'
  modal.style.zIndex = String(getMaxZIndex() + 10)
  modal.style.padding = '50px'
  modal.appendChild(buildIframe())
  modal.appendChild(buildThemeButton())
  modal.appendChild(buildCloseButton())
  document.body.appendChild(modal)
  applyTheme('dark')
  sendToWorker({ type: 'getPreference', key: 'theme' })
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

handleToolbarClick()
