import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    'tanstack-table/index': './src/integrations/tanstack-table/index.ts',
  },
  format: ['esm'],
  target: 'es2022',
  // Keep `.js` / `.d.ts`, which `exports` points at.
  fixedExtension: false,
  // Declaration maps would point at `src/`, which is not published.
  dts: { sourcemap: false },
  minify: true,
  sourcemap: true,
  clean: true,
  deps: {
    neverBundle: ['react', 'react-dom', '@tanstack/react-table', 'date-fns'],
  },
  // Explicitly exclude test files
  ignoreWatch: ['src/__tests__/**/*'],
  outDir: 'dist/',
})
