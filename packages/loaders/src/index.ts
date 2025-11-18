/**
 * @bazza-ui/loaders
 *
 * Loader creators for menu components.
 * Simple, predictable hook functions that return consistent LoaderResult interface.
 */

// Export loader creators
export { nativeLoader } from './adapters/native.js'
export { type QueryConfig, queryLoader } from './adapters/query.js'
export { type SWRConfig, swrLoader } from './adapters/swr.js'
// Export core types
export type { Loader, LoaderContext, LoaderResult } from './types.js'

// Apollo coming soon
// export { apolloLoader, type ApolloConfig } from './adapters/apollo.js'
