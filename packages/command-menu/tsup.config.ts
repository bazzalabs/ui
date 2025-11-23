import { defineConfig, type Options } from 'tsup'

export default defineConfig((options: Options) => ({
  entry: {
    index: './src/index.ts',
    middleware: './src/middleware.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  minify: !options.watch,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ['react', 'react-dom', '@tanstack/react-query'],
  outDir: 'dist/',
  onSuccess: options.watch
    ? 'echo "✅ @bazza-ui/command-menu rebuilt"'
    : undefined,
  ...options,
}))
