import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Polyfill Node.js modules with absolute paths
      stream: path.resolve(__dirname, '../../node_modules/stream-browserify/index.js'),
      'stream/promises': path.resolve(__dirname, '../../node_modules/stream-browserify/index.js'),
      crypto: path.resolve(__dirname, '../../node_modules/crypto-browserify/index.js'),
      buffer: path.resolve(__dirname, '../../node_modules/buffer/index.js'),
      path: path.resolve(__dirname, '../../node_modules/path-browserify/index.js'),
      os: path.resolve(__dirname, '../../node_modules/os-browserify/browser.js'),
      util: path.resolve(__dirname, '../../node_modules/util/util.js'),
    },
  },
  define: {
    // Polyfill global for some dependencies
    global: 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
    },
    exclude: ['@debhub/pure-irys-client'],
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
