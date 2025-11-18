/**
 * @bazza-ui/loaders
 *
 * Loader creators for menu components.
 * Simple, predictable hook functions that return consistent LoaderResult interface.
 */

// Export loader creators
export { native } from './adapters/native.js'
export { type QueryConfig, query } from './adapters/query.js'
export { type SWRConfig, swr } from './adapters/swr.js'
// Export core types
export type { Loader, LoaderContext, LoaderResult } from './types.js'

// Apollo coming soon
// export { apollo, type ApolloConfig } from './adapters/apollo.js'
