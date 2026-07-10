/**
 * CodeMirror doesn't consume Tailwind classes (it renders its own DOM via
 * EditorView.theme(), a CSS-in-JS system) — colors here are kept in sync
 * with the app palette in styles/ui.ts by hand.
 */
import { EditorView } from '@codemirror/view'

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
