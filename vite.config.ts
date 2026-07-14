import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // BuilderView's chunk carries CodeMirror legitimately heavy, and already lazy-loaded
    // (route-level code splitting in router.ts) so it only loads when the builder opens.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        'service-worker': entry('./src/background/service-worker.ts'),
        environment: entry('./src/content/environment.ts'),
        iframe: entry('./src/iframe/index.html'),
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
})
