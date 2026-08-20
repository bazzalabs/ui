import { defineConfig, type Options } from 'tsup'

export default defineConfig((options: Options) => ({
  entry: {
    'dropdown-menu/index': './src/dropdown-menu/index.ts',
    'command-menu/index': './src/command-menu/index.ts',
    'kbd/index': './src/kbd/index.ts',
    'select/index': './src/select/index.ts',
    'video-player/index': './src/video-player/index.ts',
    'combobox/index': './src/combobox/index.ts',
    'context-menu/index': './src/context-menu/index.ts',
    'adapters/index': './src/adapters/index.ts',
    'internal/listbox/index': './src/internal/listbox/index.ts',
    'internal/selection/index': './src/internal/selection/index.ts',
    'internal/popup-menu/index': './src/internal/popup-menu/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  minify: !options.watch,
  sourcemap: true,
  clean: true,
  splitting: true,
  external: ['react', 'react-dom'],
  outDir: 'dist/',
  onSuccess: options.watch ? 'echo "✅ @bazza-ui/react rebuilt"' : undefined,
  ...options,
}))
