/**
 * CodeMirror doesn't consume Tailwind classes (it renders its own DOM via
 * EditorView.theme(), a CSS-in-JS system) colors here are kept in sync
 * with the app palette in styles/ui.ts by hand.
 */
import { EditorView } from '@codemirror/view'
import { HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'

export const lightEditorTheme = EditorView.theme(
  {
    '&': { height: '100%', backgroundColor: '#ffffff', color: '#111827' }, // white / gray-900
    '.cm-content': { caretColor: '#0891b2', textAlign: 'left' }, // cyan-600
    '.cm-gutters': { backgroundColor: '#f9fafb', color: '#9ca3af', border: 'none' }, // gray-50 / gray-400
    '.cm-activeLine': { backgroundColor: '#f3f4f6' }, // gray-100
    '.cm-activeLineGutter': { backgroundColor: '#f3f4f6' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: '#cffafe', // cyan-100
    },
  },
  { dark: false },
)

export const darkEditorTheme = EditorView.theme(
  {
    '&': { height: '100%', backgroundColor: '#1f2937', color: '#f3f4f6' }, // gray-800 / gray-100
    '.cm-content': { caretColor: '#22d3ee', textAlign: 'left' }, // cyan-400
    '.cm-gutters': { backgroundColor: '#111827', color: '#6b7280', border: 'none' }, // gray-900 / gray-500
    '.cm-activeLine': { backgroundColor: '#111827' },
    '.cm-activeLineGutter': { backgroundColor: '#111827' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: '#164e63', // cyan-900
    },
  },
  { dark: true },
)

/**
 * @codemirror/language's defaultHighlightStyle is tuned for light
 * backgrounds several token colors (plain identifiers, some punctuation)
 * are dark, low-contrast blues/grays that are barely readable against our
 * dark editor background. This is a dedicated dark-mode palette instead.
 */
export const darkHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: '#6b7280' }, // gray-500
  { tag: tags.keyword, color: '#c084fc' }, // violet-400
  { tag: [tags.name, tags.propertyName], color: '#f3f4f6' }, // gray-100
  { tag: [tags.string, tags.special(tags.string)], color: '#4ade80' }, // green-400
  { tag: tags.number, color: '#fb923c' }, // orange-400
  { tag: tags.bool, color: '#fb923c' },
  { tag: tags.null, color: '#fb923c' },
  { tag: [tags.definition(tags.variableName), tags.function(tags.variableName)], color: '#67e8f9' }, // cyan-300
  { tag: tags.variableName, color: '#f3f4f6' },
  { tag: tags.operator, color: '#f3f4f6' },
  { tag: tags.className, color: '#facc15' }, // yellow-400
  { tag: tags.typeName, color: '#facc15' },
  { tag: tags.punctuation, color: '#9ca3af' }, // gray-400
  { tag: tags.invalid, color: '#f87171' }, // red-400
])
