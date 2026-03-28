// ============================================================================
// Async Menu Adapters
// ============================================================================
// Adapters for integrating async data libraries with async menus.

// SWR Adapter
export {
  type CreateSWRQueryLoaderProps,
  type CreateSWRStaticLoaderProps,
  createSWRLoaderComponent,
  createSWRQueryLoader,
  createSWRStaticLoader,
  type SWRResult,
  toAsyncLoaderResultFromSWR,
} from './swr.js'
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
