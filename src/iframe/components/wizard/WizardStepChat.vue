<script setup lang="ts">
import { inject, ref } from 'vue'
import { parse } from 'acorn'
import { useRouter } from 'vue-router'
import { ui } from '@/styles/ui'
import { useToast } from '../../plugins/toast'
import { saveTool, type StoredTool } from '@/shared/toolsDb'
import { channelKey } from '@/shared/vuePlugins/messaging'
import type { WizardData } from './WizardData'
import CodeEditor from './CodeEditor.vue'

const data = defineModel<WizardData>('data', { required: true })
const toast = useToast()
const router = useRouter()
const channel = inject(channelKey)

/** Any edit invalidates a previous test — must be tested again before saving. */
function onCodeChange(value: string): void {
  data.value.code = value
  if (data.value.codeTested) data.value.codeTested = false
}

const testing = ref(false)

/**
 * Two checks: syntax (Acorn, a pure parser — never eval, never executes the
 * code) and then a real run on the bundled, worker-governed test page, which
 * catches things Acorn can't see (e.g. `fdfgsdf` alone is valid syntax but
 * throws a ReferenceError at runtime). Still isolated from any real page — it
 * only proves the code runs without throwing, not that it does the right
 * thing.
 */
async function test(): Promise<void> {
  if (data.value.code.trim() === '') {
    toast.error(chrome.i18n.getMessage('wizardCodeEmpty'))
    return
  }

  try {
    parse(data.value.code, { ecmaVersion: 'latest', sourceType: 'script' })
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error)
    toast.error(`${chrome.i18n.getMessage('wizardCodeInvalid')}: ${details}`)
    return
  }

  if (!channel) return

  testing.value = true
  const result = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
    const unsubscribe = channel.subscribe((message) => {
      if (message.type !== 'testCodeResult') return
      unsubscribe()
      resolve(message)
    })
    channel.send({ type: 'testCode', code: data.value.code, trigger: data.value.trigger ?? 'pageStart' })
  })
  testing.value = false

  if (!result.ok) {
    toast.error(`${chrome.i18n.getMessage('wizardRuntimeError')}: ${result.error}`)
    return
  }

  data.value.codeTested = true
  toast.success(chrome.i18n.getMessage('wizardTestPassed'))
}

async function save(): Promise<void> {
  const tool: StoredTool = {
    id: data.value.id ?? crypto.randomUUID(),
    name: data.value.name,
    description: data.value.description,
    trigger: data.value.trigger ?? 'pageStart',
    scope: data.value.scope,
    scopeTargets: data.value.scopeTargets,
    code: data.value.code,
    createdAt: data.value.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  }
  await saveTool(tool)
  toast.success(chrome.i18n.getMessage('wizardToolSaved'))
  // ToolsPanel fetches its list on mount, so returning Home reloads it fresh.
  router.push('/')
}

const testLabel = chrome.i18n.getMessage('wizardTest')
const saveLabel = chrome.i18n.getMessage('wizardSave')
</script>

<template>
  <div :class="ui.wizardStepBody">
    <CodeEditor :model-value="data.code" @update:model-value="onCodeChange" />
    <div :class="ui.wizardCodeActions">
      <button
        type="button"
        :class="ui.secondaryButton"
        :disabled="testing"
        @click="test"
      >
        {{ testLabel }}
      </button>
      <button
        type="button"
        :class="ui.primaryButton"
        :disabled="!data.codeTested"
        @click="save"
      >
        {{ saveLabel }}
      </button>
    </div>
  </div>
</template>
