import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url))

// Content scripts (environment, resumer) are injected by Chrome as classic scripts
// (chrome.scripting has no way to mark a content script injection as type="module"). ES module
// output needs no IIFE wrapper (the module system itself provides scoping), so when that output
// is forced to run as a classic script, its top-level declarations land in the shared global
// scope of the page's isolated world. Two independently-minified content scripts sharing that
// scope can then collide on short variable names and silently overwrite each other's bindings.
// Building these as IIFE gives each its own function scope, closing that hole.
// service-worker and iframe stay ES modules: the manifest declares "type": "module" for the
// worker, and the iframe is loaded via <script type="module">.
// IIFE output doesn't support code-splitting, so each content script is its own single-entry
// build pass (VITE_BUILD_PASS picks which one) rather than sharing one multi-entry pass.
const CONTENT_SCRIPT_ENTRIES: Record<string, () => Record<string, string>> = {
  environment: () => ({ environment: entry('./src/content/environment.ts') }),
  resumer: () => ({ resumer: entry('./src/content/resumer.ts') }),
}
const MODULE_ENTRIES = {
  'service-worker': entry('./src/background/service-worker.ts'),
  iframe: entry('./src/iframe/index.html'),
}

const buildPass = process.env.VITE_BUILD_PASS
const contentScriptEntry = buildPass ? CONTENT_SCRIPT_ENTRIES[buildPass] : undefined

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: !contentScriptEntry,
    // BuilderView's chunk carries CodeMirror legitimately heavy, and already lazy-loaded
    // (route-level code splitting in router.ts) so it only loads when the builder opens.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: contentScriptEntry ? contentScriptEntry() : MODULE_ENTRIES,
      output: {
        format: contentScriptEntry ? 'iife' : 'es',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
})
