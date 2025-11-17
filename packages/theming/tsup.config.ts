import { defineConfig, type Options } from 'tsup'

export default defineConfig((options: Options) => ({
  entry: {
    index: './src/index.ts',
  },
  format: ['esm'],
  dts: true,
  minify: !options.watch,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ['react', '@bazza-ui/menu'],
  outDir: 'dist/',
  onSuccess: options.watch ? 'echo "✅ Package rebuilt"' : undefined,
  ...options,
}))
