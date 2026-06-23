import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/components', 'src/lib', 'src/hooks', 'src/types.ts'],
      tsconfigPath: './tsconfig.lib.json',
      outDir: 'dist-lib',
      rollupTypes: false,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/components/index.ts'),
      name: 'MysteryBox',
      formats: ['es'],
      fileName: () => 'index.es.js',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        // CJS packages that cause __require() in the Vite ESM output — let the
        // converter's esbuild handle them natively (it converts CJS→ESM correctly)
        'use-sync-external-store',
        'use-sync-external-store/shim',
        'use-sync-external-store/shim/with-selector',
      ],
    },
    outDir: 'dist-lib',
    sourcemap: false,
    minify: false,
    cssCodeSplit: false,
  },
})
