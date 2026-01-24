// ============================================================================
// Async Menu Adapters
// ============================================================================
// Adapters for integrating async data libraries with async menus.

// TanStack Query Adapter
export {
  type CreateQueryLoaderProps,
  type CreateStaticLoaderProps,
  createLoaderComponent,
  createQueryLoader,
  createStaticLoader,
  type TanStackQueryResult,
  toAsyncLoaderResult,
} from './tanstack-query.js'

// Vanilla Adapter (no external dependencies)
export {
  type CreateVanillaQueryLoaderProps,
  type CreateVanillaStaticLoaderProps,
  createVanillaQueryLoader,
  createVanillaStaticLoader,
} from './vanilla.js'
