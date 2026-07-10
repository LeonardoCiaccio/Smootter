<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Compartment, EditorState } from '@codemirror/state'
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { javascript } from '@codemirror/lang-javascript'
import { ui } from '@/styles/ui'
import { useTheme } from '@/shared/vuePlugins/theme'
import { darkEditorTheme, lightEditorTheme } from './codeEditorTheme'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const container = ref<HTMLDivElement>()
const themeCompartment = new Compartment()
const { theme } = useTheme()
let view: EditorView | undefined

function editorTheme() {
  return theme.value === 'dark' ? darkEditorTheme : lightEditorTheme
}

onMounted(() => {
  if (!container.value) return
  view = new EditorView({
    parent: container.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        javascript(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        themeCompartment.of(editorTheme()),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) emit('update:modelValue', update.state.doc.toString())
        }),
      ],
    }),
  })
})

watch(theme, () => {
  view?.dispatch({ effects: themeCompartment.reconfigure(editorTheme()) })
})

onBeforeUnmount(() => view?.destroy())
</script>

<template>
  <div ref="container" :class="ui.codeEditor" />
</template>
