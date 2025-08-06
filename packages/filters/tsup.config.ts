import { defineConfig, type Options } from 'tsup'

export default defineConfig((options: Options) => ({
  entry: {
    index: './src/index.ts',
    'tanstack-table/index': './src/integrations/tanstack-table/index.ts',
  },
  format: ['esm'],
  dts: true,
  minify: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ['react', 'react-dom', '@tanstack/react-table', 'date-fns'],
  // Explicitly exclude test files
  ignoreWatch: ['src/__tests__/**/*'],
  outDir: 'dist/',
  ...options,
}))
