import { defineConfig, type Options } from 'tsup'

export default defineConfig((options: Options) => ({
  entry: {
    index: './src/index.ts',
    'react/index': './src/react/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  minify: !options.watch,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ['react', 'react-dom', 'date-fns'],
  ignoreWatch: ['src/__tests__/**/*'],
  outDir: 'dist/',
  onSuccess: options.watch
    ? 'echo "✅ @bazza-ui/data-view rebuilt"'
    : undefined,
  ...options,
}))
