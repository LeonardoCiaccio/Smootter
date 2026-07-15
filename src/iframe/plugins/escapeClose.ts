/**
 * escapeClose Vue plugin: pressing Escape anywhere in the app closes the environment modal,
 * the same request AppToolbar's close button sends.
 */
export const escapeClose = {
  install(): void {
    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return
      void chrome.runtime.sendMessage({ type: 'closeModal' })
    })
  },
}
