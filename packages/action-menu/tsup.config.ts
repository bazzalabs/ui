import { defineConfig, type Options } from 'tsup'

export default defineConfig((options: Options) => ({
  entry: {
    index: './src/index.ts',
  },
  format: ['esm'],
  dts: true,
  minify: !options.watch, // Don't minify in watch mode for faster builds
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ['react', 'react-dom'],
  // Explicitly exclude test files
  ignoreWatch: ['src/__tests__/**/*'],
  outDir: 'dist/',
  onSuccess: options.watch ? 'echo "✅ Package rebuilt"' : undefined,
  ...options,
}))
