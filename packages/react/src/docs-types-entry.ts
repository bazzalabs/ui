/**
 * Docs-tooling aggregation entry. NOT part of the public API: not listed in
 * package.json `exports` and not a tsup entry. It exists solely so the docs
 * site's types-meta generator (`apps/web/scripts/build-types-meta.ts`) can
 * traverse all public types under one `@bazza-ui/react` key, replacing the
 * root barrel removed when the package moved to subpath entrypoints.
 */
export * from './adapters/index.js'
export * from './combobox/index.js'
export * from './context-menu/index.js'
export * from './dropdown-menu/index.js'
export * from './select/index.js'
