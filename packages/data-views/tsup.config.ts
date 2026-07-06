import { defineConfig, type Options } from 'tsup'

export default defineConfig((options: Options) => ({
  entry: {
    index: './src/index.ts',
  },
  format: ['esm'],
  dts: true,
  minify: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ['date-fns'],
  // Explicitly exclude test files
  ignoreWatch: ['src/**/*.test.ts'],
  outDir: 'dist/',
  ...options,
}))
