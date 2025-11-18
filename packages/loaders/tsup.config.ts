import { defineConfig, type Options } from 'tsup'

export default defineConfig((options: Options) => ({
  entry: {
    index: './src/index.ts',
    'adapters/query': './src/adapters/query.ts',
    'adapters/swr': './src/adapters/swr.ts',
    'adapters/apollo': './src/adapters/apollo.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  minify: !options.watch,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: [
    'react',
    'react-dom',
    '@tanstack/react-query',
    'swr',
    '@apollo/client',
  ],
  outDir: 'dist/',
  onSuccess: options.watch ? 'echo "✅ @bazza-ui/loaders rebuilt"' : undefined,
  ...options,
}))
