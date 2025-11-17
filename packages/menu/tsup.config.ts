import { defineConfig, type Options } from 'tsup'

export default defineConfig((options: Options) => ({
  entry: {
    index: './src/index.ts',
    'loaders/tanstack-query': './src/loaders/tanstack-query.tsx',
  },
  format: ['esm', 'cjs'],
  dts: true,
  minify: !options.watch,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ['react', 'react-dom', '@tanstack/react-query'],
  outDir: 'dist/',
  onSuccess: options.watch ? 'echo "✅ @bazza-ui/menu rebuilt"' : undefined,
  ...options,
}))
