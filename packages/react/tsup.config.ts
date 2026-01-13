import { defineConfig, type Options } from 'tsup'

export default defineConfig((options: Options) => ({
  entry: {
    index: './src/index.ts',
    'internal/listbox/index': './src/internal/listbox/index.ts',
    'internal/popup-menu/index': './src/internal/popup-menu/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  minify: !options.watch,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ['react', 'react-dom'],
  outDir: 'dist/',
  onSuccess: options.watch ? 'echo "✅ @bazza-ui/react rebuilt"' : undefined,
  ...options,
}))
