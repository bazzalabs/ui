import { defineConfig } from 'tsdown'

export default defineConfig((options) => ({
  entry: {
    'dropdown-menu/index': './src/dropdown-menu/index.ts',
    'command-menu/index': './src/command-menu/index.ts',
    'suggestion-menu/index': './src/suggestion-menu/index.ts',
    'kbd/index': './src/kbd/index.ts',
    'select/index': './src/select/index.ts',
    'video-player/index': './src/video-player/index.ts',
    'combobox/index': './src/combobox/index.ts',
    'context-menu/index': './src/context-menu/index.ts',
    'loaders/index': './src/loaders/index.ts',
    'internal/listbox/index': './src/internal/listbox/index.ts',
    'internal/popup-menu/index': './src/internal/popup-menu/index.ts',
  },
  format: {
    esm: {},
    // `exports` resolves types through `.d.ts` for both conditions, so the
    // CommonJS build needs no declarations of its own.
    cjs: { dts: false },
  },
  outputOptions: (output, format) =>
    format === 'cjs' ? { ...output, strict: true, esModule: true } : output,
  target: 'es2022',
  // Keep `.js` / `.cjs` / `.d.ts`, which `exports` points at.
  fixedExtension: false,
  // Declaration maps would point at `src/`, which is not published.
  dts: { sourcemap: false },
  minify: !options.watch,
  sourcemap: true,
  clean: true,
  deps: {
    neverBundle: ['react', 'react-dom'],
  },
  outDir: 'dist/',
  onSuccess: options.watch ? 'echo "✅ @bazza-ui/react rebuilt"' : undefined,
}))
