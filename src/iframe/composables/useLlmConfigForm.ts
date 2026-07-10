/**
 * useLlmConfigForm — shared form/test/save logic for the LLM endpoint config,
 * used by both the wizard's setup popup and the Options page section.
 */
import { inject, reactive, ref, watch } from 'vue'
import { channelKey } from '@/shared/vuePlugins/messaging'
import { llmErrorText } from '@/shared/llmErrorText'
import type { LlmConfig } from '@/shared/preferences'

export function useLlmConfigForm() {
  const channel = inject(channelKey)

  const form = reactive<LlmConfig>({ endpoint: '', apiKey: '', model: '' })
  const testing = ref(false)
  const verdict = ref<'idle' | 'ok' | 'error'>('idle')
  const errorMessage = ref('')

  // Any edit invalidates a previous test — must be tested again before saving.
  watch(form, () => (verdict.value = 'idle'))

  /** Loads the saved config into the form, if any. Returns whether one existed. */
  async function loadSaved(): Promise<boolean> {
    if (!channel) return false
    const response = await channel.send({ type: 'getPreference', key: 'llmConfig' })
    if (response.type !== 'preferenceValue' || !response.value) return false
    Object.assign(form, response.value)
    return true
  }

  async function test(): Promise<void> {
    if (!channel) return
    if (!form.endpoint.trim() || !form.apiKey.trim() || !form.model.trim()) {
      verdict.value = 'error'
      errorMessage.value = chrome.i18n.getMessage('llmFieldsRequired')
      return
    }

    testing.value = true
    verdict.value = 'idle'
    const response = await channel.send({ type: 'testLlmConfig', config: { ...form } })
    testing.value = false

    if (response.type !== 'testLlmConfigResult') {
      verdict.value = 'error'
      errorMessage.value = llmErrorText('unknown', undefined)
      return
    }
    if (response.ok) {
      verdict.value = 'ok'
    } else {
      verdict.value = 'error'
      errorMessage.value = llmErrorText(response.errorCode, response.detail)
    }
  }

  /** Persists the form as the saved config. Caller should gate this on verdict === 'ok'. */
  async function persist(): Promise<void> {
    if (!channel) return
    await channel.send({ type: 'setPreference', key: 'llmConfig', value: { ...form } })
  }

  /** Erases the saved config and blanks the form. */
  async function clear(): Promise<void> {
    if (!channel) return
    await channel.send({ type: 'removePreference', key: 'llmConfig' })
    form.endpoint = ''
    form.apiKey = ''
    form.model = ''
    verdict.value = 'idle'
  }

  return { form, testing, verdict, errorMessage, loadSaved, test, persist, clear }
}
