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

// Calm accent for status indicators (kept distinct from the brand's alert-like orange)
const accentColor = '#38bdf8'

const modalStyles: Record<
  Theme,
  { backdrop: string; icon: string; pillBg: string; pillBorder: string; pillShadow: string }
> = {
  // Matches the iframe's Tailwind background exactly (bg-white / dark:bg-gray-900)
  light: {
    backdrop: '#ffffff',
    icon: '#000',
    pillBg: 'rgba(0, 0, 0, 0.04)',
    pillBorder: 'rgba(0, 0, 0, 0.08)',
    pillShadow: '0 2px 10px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
  },
  dark: {
    backdrop: '#111827',
    icon: '#fff',
    pillBg: 'rgba(255, 255, 255, 0.06)',
    pillBorder: 'rgba(255, 255, 255, 0.12)',
    pillShadow: '0 4px 20px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
  },
}

// Heroicons (24 outline)
const closeIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:100%;height:100%"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>'
const moonIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:100%;height:100%"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/></svg>'
const sunIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:100%;height:100%"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/></svg>'
const settingsIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:100%;height:100%"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>'

// ---- Channel (to the background hub) ----
let port: chrome.runtime.Port | undefined
// The user toggled during load: ignore the late initial theme reply
let userChoseTheme = false

function handleWorkerMessage(message: ChannelResponse): void {
  if (message.type === 'topMessage') {
    setTopMessage(message.value)
    return
  }

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
  if (modal) modal.style.display = 'flex' // matches the flex column set on creation
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
  modal
    .querySelectorAll<HTMLElement>('[data-tint]')
    .forEach((element) => (element.style.color = style.icon))
  const themeButton = modal.querySelector<HTMLButtonElement>('[data-role="theme"]')
  if (themeButton) themeButton.innerHTML = theme === 'dark' ? sunIcon : moonIcon
  const pill = modal.querySelector<HTMLElement>('[data-role="topMessage"]')
  if (pill) {
    pill.style.backgroundColor = style.pillBg
    pill.style.borderColor = style.pillBorder
    pill.style.boxShadow = style.pillShadow
  }
  const frame = modal.querySelector<HTMLElement>('[data-role="frame"]')
  if (frame) frame.style.backgroundColor = style.backdrop
}

/** Set the centered top message text. */
function setTopMessage(text: string): void {
  const element = getModal()?.querySelector<HTMLElement>('[data-role="topMessageText"]')
  if (element) element.textContent = text
}

function toggleTheme(): void {
  userChoseTheme = true
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  sendToWorker({ type: 'setPreference', key: 'theme', value: next })
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

function styleIconButton(button: HTMLButtonElement, size: number): void {
  button.dataset.tint = ''
  button.style.display = 'flex'
  button.style.flexShrink = '0'
  button.style.width = `${size}px`
  button.style.height = `${size}px`
  button.style.padding = '0'
  button.style.border = 'none'
  button.style.background = 'transparent'
  button.style.cursor = 'pointer'
}

function buildCloseButton(): HTMLButtonElement {
  const button = document.createElement('button')
  button.innerHTML = closeIcon
  styleIconButton(button, 20)
  button.addEventListener('click', hide)
  return button
}

/** Left group: logo + app name + version, from the manifest. */
function buildAppInfo(): HTMLDivElement {
  const manifest = chrome.runtime.getManifest()
  const container = document.createElement('div')
  container.dataset.tint = ''
  container.style.display = 'flex'
  container.style.alignItems = 'center'
  container.style.gap = '8px'
  container.style.fontFamily = 'system-ui, sans-serif'

  const logo = document.createElement('img')
  logo.src = chrome.runtime.getURL('icons/icon-32.png')
  logo.style.width = '20px'
  logo.style.height = '20px'

  const name = document.createElement('span')
  name.textContent = manifest.name
  name.style.fontSize = '14px'
  name.style.fontWeight = '600'

  const version = document.createElement('span')
  version.textContent = 'v' + manifest.version
  version.style.fontSize = '12px'
  version.style.opacity = '0.6'

  container.append(logo, name, version)
  return container
}

/** Centered top message pill (glass, accent dot), filled on demand. */
function buildTopMessage(): HTMLDivElement {
  const pill = document.createElement('div')
  pill.dataset.role = 'topMessage'
  pill.style.display = 'flex'
  pill.style.alignItems = 'center'
  pill.style.gap = '8px'
  pill.style.minWidth = '0'
  pill.style.maxWidth = '320px'
  pill.style.height = '32px'
  pill.style.padding = '0 18px'
  pill.style.borderRadius = '999px'
  pill.style.border = '1px solid transparent'
  pill.style.backdropFilter = 'blur(10px) saturate(160%)'
  pill.style.transition = 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'

  const dot = document.createElement('span')
  dot.style.display = 'block'
  dot.style.width = '6px'
  dot.style.height = '6px'
  dot.style.borderRadius = '50%'
  dot.style.flexShrink = '0'
  dot.style.alignSelf = 'center'
  dot.style.background = accentColor
  dot.style.boxShadow = `0 0 6px ${accentColor}`

  const text = document.createElement('span')
  text.dataset.role = 'topMessageText'
  text.dataset.tint = ''
  text.style.overflow = 'hidden'
  text.style.whiteSpace = 'nowrap'
  text.style.textOverflow = 'ellipsis'
  text.style.fontSize = '13px'
  text.style.fontWeight = '500'
  text.style.letterSpacing = '0.01em'
  text.style.fontFamily = 'system-ui, sans-serif'

  pill.append(dot, text)
  return pill
}

function buildThemeButton(): HTMLButtonElement {
  const button = document.createElement('button')
  button.dataset.role = 'theme'
  styleIconButton(button, 16)
  button.addEventListener('click', toggleTheme)
  return button
}

function buildSettingsButton(): HTMLButtonElement {
  const button = document.createElement('button')
  button.innerHTML = settingsIcon
  styleIconButton(button, 16)
  button.addEventListener('click', () => console.log('hello world'))
  return button
}

/** Right group: theme toggle, settings, close — in normal flow, evenly spaced. */
function buildActions(): HTMLDivElement {
  const actions = document.createElement('div')
  actions.style.display = 'flex'
  actions.style.alignItems = 'center'
  actions.style.gap = '10px'

  const close = buildCloseButton()
  close.style.marginLeft = '10px' // extra breathing room before the close button

  actions.append(buildThemeButton(), buildSettingsButton(), close)
  return actions
}

/** Toolbar: app info (left) · top message (center) · actions (right). True centering via a 3-column grid. */
function buildToolbar(): HTMLDivElement {
  const toolbar = document.createElement('div')
  toolbar.style.display = 'grid'
  toolbar.style.gridTemplateColumns = '1fr auto 1fr'
  toolbar.style.alignItems = 'center'
  toolbar.style.columnGap = '16px'
  toolbar.style.padding = '16px 20px'
  toolbar.style.flexShrink = '0'

  const left = buildAppInfo()
  left.style.justifySelf = 'start'

  const center = buildTopMessage()
  center.style.justifySelf = 'center'

  const right = buildActions()
  right.style.justifySelf = 'end'

  toolbar.append(left, center, right)
  return toolbar
}

/** Footer: general info (copyright, version). */
function buildFooter(): HTMLDivElement {
  const manifest = chrome.runtime.getManifest()
  const footer = document.createElement('div')
  footer.dataset.tint = ''
  footer.style.flexShrink = '0'
  footer.style.padding = '10px 20px'
  footer.style.textAlign = 'center'
  footer.style.fontSize = '11px'
  footer.style.opacity = '0.5'
  footer.style.fontFamily = 'system-ui, sans-serif'
  footer.textContent = `© ${new Date().getFullYear()} ${manifest.name} · v${manifest.version}`
  return footer
}

function buildIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe')
  iframe.dataset.role = 'frame'
  iframe.src = iframeUrl
  iframe.style.display = 'block'
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.border = 'none'
  return iframe
}

/** Content: fills all remaining space between the toolbar and the footer. */
function buildContent(): HTMLDivElement {
  const content = document.createElement('div')
  content.style.position = 'relative'
  content.style.flex = '1'
  content.style.minHeight = '0'
  content.appendChild(buildIframe())
  return content
}

function createModal(): void {
  const modal = document.createElement('div')
  modal.id = modalId
  modal.style.position = 'fixed'
  modal.style.inset = '0'
  modal.style.zIndex = String(getMaxZIndex() + 10)
  modal.style.display = 'flex'
  modal.style.flexDirection = 'column'
  modal.appendChild(buildToolbar())
  modal.appendChild(buildContent())
  modal.appendChild(buildFooter())
  document.body.appendChild(modal)
  applyTheme('dark')
  sendToWorker({ type: 'getPreference', key: 'theme' })
  sendToWorker({ type: 'getTopMessage' })
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
