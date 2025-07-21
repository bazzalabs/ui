import { type Options, defineConfig } from 'tsup'

export default defineConfig((options: Options) => ({
  entry: {
    index: './src/index.ts',
    'integrations/tanstack-table/index':
      './src/integrations/tanstack-table/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,
  external: ['react', 'react-dom', '@tanstack/react-table', 'date-fns'],
  outDir: 'dist',
  // Explicitly exclude test files
  ignoreWatch: ['src/__tests__/**/*'],
  ...options,
}))
