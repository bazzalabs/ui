import {
  type DocumentNode,
  type OperationVariables,
  type QueryHookOptions,
  useQuery,
} from '@apollo/client'
import type { Loader, LoaderContext, LoaderResult } from '../types.js'

/**
 * Configuration for Apollo GraphQL loader
 */
export type ApolloConfig<
  TData = any,
  TVariables extends OperationVariables = OperationVariables,
> = {
  /** GraphQL query document */
  query: DocumentNode
  /** GraphQL query variables */
  variables?: TVariables | ((ctx: LoaderContext) => TVariables)
  /** Transform the Apollo data before returning */
  select?: (data: TData) => any
  /** Whether to skip the query */
  skip?: boolean
  /** Fetch policy */
  fetchPolicy?:
    | 'cache-first'
    | 'cache-and-network'
    | 'network-only'
    | 'cache-only'
    | 'no-cache'
    | 'standby'
  /** Error policy */
  errorPolicy?: 'none' | 'ignore' | 'all'
  /** Polling interval in ms */
  pollInterval?: number
  /** Whether to notify on network status change */
  notifyOnNetworkStatusChange?: boolean
}

/**
 * Apollo GraphQL loader creator function.
 * Creates a loader hook that uses Apollo Client for GraphQL queries.
 *
 * @example
 * ```tsx
 * import { apollo } from '@bazza-ui/loaders/apollo'
 * import { gql } from '@apollo/client'
 *
 * const GET_ITEMS = gql`
 *   query GetItems($limit: Int!) {
 *     items(limit: $limit) {
 *       id
 *       name
 *     }
 *   }
 * `
 *
 * const itemsLoader = apollo({
 *   query: GET_ITEMS,
 *   variables: { limit: 10 },
 *   select: (data) => data.items.map(item => ({
 *     kind: 'item',
 *     id: item.id,
 *     label: item.name
 *   }))
 * })
 * ```
 *
 * @example With dynamic variables
 * ```tsx
 * const searchLoader = apollo({
 *   query: SEARCH_QUERY,
 *   variables: (context) => ({ query: context.query }),
 *   skip: (context) => !context.query
 * })
 * ```
 */
export function apollo<
  TData = any,
  TVariables extends OperationVariables = OperationVariables,
>(
  configOrFn:
    | ApolloConfig<TData, TVariables>
    | ((ctx: LoaderContext) => ApolloConfig<TData, TVariables>),
): Loader<any> {
  // Return a hook function that follows the Loader interface
  return (context: LoaderContext): LoaderResult<any> => {
    // Resolve config (can be static or dynamic based on context)
    const cfg =
      typeof configOrFn === 'function' ? configOrFn(context) : configOrFn

    // Resolve variables if it's a function
    const variables =
      typeof cfg.variables === 'function'
        ? cfg.variables(context)
        : cfg.variables

    // Build Apollo options
    const apolloOptions: QueryHookOptions = {
      variables,
      skip: cfg.skip ?? !(context.isOpen ?? true),
      fetchPolicy: cfg.fetchPolicy ?? 'cache-first',
      errorPolicy: cfg.errorPolicy ?? 'none',
      pollInterval: cfg.pollInterval,
      notifyOnNetworkStatusChange: cfg.notifyOnNetworkStatusChange,
    }

    const result = useQuery(cfg.query, apolloOptions)

    // Transform data if select function provided
    const data =
      cfg.select && result.data ? cfg.select(result.data) : result.data

    // Return consistent LoaderResult interface
    return {
      data,
      isLoading: result.loading,
      isError: !!result.error,
      error: result.error ?? null,
    }
  }
}
