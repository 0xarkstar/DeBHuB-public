import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Polyfill Node.js modules
      stream: 'stream-browserify',
      'stream/promises': 'stream-browserify',
      crypto: 'crypto-browserify',
      buffer: 'buffer',
      path: 'path-browserify',
      fs: 'memfs',
      os: 'os-browserify/browser',
      util: 'util',
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
