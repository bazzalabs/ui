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
  external: ['react', 'react-dom'],
  // Explicitly exclude test files
  ignoreWatch: ['src/__tests__/**/*'],
  outDir: 'dist/',
  ...options,
}))
