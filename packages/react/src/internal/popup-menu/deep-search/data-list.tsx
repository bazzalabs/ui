'use client'

import * as React from 'react'
import { useSurfaceContext } from '../../listbox/index.js'
import { normalizeValue } from '../../listbox/utils/normalize.js'
import { PopupMenuList } from '../components/list/list.js'
import {
  type AsyncMenuState,
  useAsyncMenuCoordinator,
} from './async-coordinator.js'
import { type RenderNodeFn, useDataSurfaceContext } from './context.js'
import type {
  AsyncLoaderResult,
  AsyncNodesConfig,
  BreadcrumbNode,
  CheckboxItemDef,
  DataListChildrenState,
  DataListProps,
  DisplayNode,
  DisplayRowNode,
  GetQualifiedRowIdFn,
  GroupRenderContext,
  ItemDef,
  NodeDef,
  QueryDependentLoaderConfig,
  RadioGroupDef,
  RowRenderContext,
  SubmenuDef,
  SubpageDef,
} from './types.js'
import {
  isDisplayGroupNode,
  isDisplayRadioGroupNode,
  isDisplaySeparatorNode,
} from './types.js'
import {
  type AsyncSubmenuInfo,
  collectAsyncSubmenus,
  filterNodes,
  getSubpagePageId,
  mergeAsyncNodesIntoTree,
  shouldLoadEagerly,
} from './utils.js'

// ============================================================================
// Helper: Compute composite IDs for all row nodes
// ============================================================================

/**
 * Computes and sets composite IDs directly on all row nodes in the display list.
 * Mutates the displayNodes in place for performance.
 * The index is the flat position across all items (including those inside groups).
 */
function computeItemIds(
  displayNodes: DisplayNode[],
  getQualifiedRowId: GetQualifiedRowIdFn,
  isDeepSearching: boolean,
): void {
  let index = 0

  for (const displayNode of displayNodes) {
    if (isDisplayGroupNode(displayNode)) {
      for (const item of displayNode.items) {
        item.compositeId = getQualifiedRowId({
          node: item.node,
          value: item.node.value,
          id: item.node.id,
          index,
          breadcrumbs: item.context.breadcrumbs,
          isDeepSearching,
          search: item.context.search,
          isDeepSearchResult: item.context.isDeepSearchResult,
          group: item.context.group,
          radioGroup: null,
        })
        index++
      }
    } else if (isDisplayRadioGroupNode(displayNode)) {
      for (const item of displayNode.items) {
        item.compositeId = getQualifiedRowId({
          node: item.node,
          value: item.node.value,
          id: item.node.id,
          index,
          breadcrumbs: item.context.breadcrumbs,
          isDeepSearching,
          search: item.context.search,
          isDeepSearchResult: item.context.isDeepSearchResult,
          group: null,
          radioGroup: item.radioGroup ?? null,
        })
        index++
      }
    } else if (isDisplaySeparatorNode(displayNode)) {
      // Separators don't need IDs
    } else {
      // Row node
      displayNode.compositeId = getQualifiedRowId({
        node: displayNode.node,
        value: displayNode.node.value,
        id: displayNode.node.id,
        index,
        breadcrumbs: displayNode.context.breadcrumbs,
        isDeepSearching,
        search: displayNode.context.search,
        isDeepSearchResult: displayNode.context.isDeepSearchResult,
        group: displayNode.context.group,
        radioGroup: displayNode.radioGroup ?? null,
      })
      index++
    }
  }
}

/**
 * Extracts ordered composite IDs from display nodes for store navigation.
 * Assumes `computeItemIds` has already been called to set `compositeId` on each node.
 */
function getOrderedItemIds(displayNodes: DisplayNode[]): string[] {
  const ids: string[] = []

  for (const displayNode of displayNodes) {
    if (isDisplayGroupNode(displayNode)) {
      for (const item of displayNode.items) {
        if (!item.node.disabled && item.compositeId) {
          ids.push(item.compositeId)
        }
      }
    } else if (isDisplayRadioGroupNode(displayNode)) {
      for (const item of displayNode.items) {
        if (!item.node.disabled && item.compositeId) {
          ids.push(item.compositeId)
        }
      }
    } else if (isDisplaySeparatorNode(displayNode)) {
      // skip
    } else {
      if (!displayNode.node.disabled && displayNode.compositeId) {
        ids.push(displayNode.compositeId)
      }
    }
  }

  return ids
}

function isAppendOnlyOrderedItemsUpdate(
  previousIds: string[],
  nextIds: string[],
): boolean {
  if (previousIds.length === 0 || nextIds.length <= previousIds.length) {
    return false
  }

  for (let i = 0; i < previousIds.length; i++) {
    if (previousIds[i] !== nextIds[i]) {
      return false
    }
  }

  return true
}

function getBreadcrumbStreamKey(breadcrumbs: BreadcrumbNode[]): string {
  return breadcrumbs
    .map((breadcrumb) => breadcrumb.id ?? breadcrumb.value)
    .join('>')
}

function getDisplayNodeStreamKey(displayNode: DisplayNode): string {
  if (isDisplayGroupNode(displayNode)) {
    return `group:${displayNode.group.id}:${getBreadcrumbStreamKey(displayNode.context.breadcrumbs)}`
  }

  if (isDisplayRadioGroupNode(displayNode)) {
    return `radio-group:${displayNode.radioGroup.id}:${getBreadcrumbStreamKey(displayNode.context.breadcrumbs)}`
  }

  if (isDisplaySeparatorNode(displayNode)) {
    return `separator:${displayNode.separator.id ?? 'separator'}`
  }

  return `row:${displayNode.node.kind}:${displayNode.node.id ?? ''}:${displayNode.node.value}:${getBreadcrumbStreamKey(displayNode.context.breadcrumbs)}`
}

const identityQuery = (query: string) => query

function orderDisplayNodesForStreaming(
  displayNodes: DisplayNode[],
  previousOrder: string[],
): {
  orderedNodes: DisplayNode[]
  nextOrder: string[]
} {
  const currentEntries = displayNodes.map(
    (node) => [getDisplayNodeStreamKey(node), node] as const,
  )

  const currentByKey = new Map(currentEntries)
  const currentOrder = currentEntries.map(([key]) => key)

  const preservedOrder = previousOrder.filter((key) => currentByKey.has(key))
  const preservedKeysSet = new Set(preservedOrder)
  const appendedOrder = currentOrder.filter((key) => !preservedKeysSet.has(key))
  const nextOrder = [...preservedOrder, ...appendedOrder]

  const orderedNodes = nextOrder
    .map((key) => currentByKey.get(key))
    .filter((node): node is DisplayNode => node !== undefined)

  return { orderedNodes, nextOrder }
}

// ============================================================================
// Async Loader Component
// ============================================================================

interface AsyncLoaderRendererProps {
  info: AsyncSubmenuInfo
  query: string
  enabled: boolean
}

interface QueryExecutionState {
  effectiveQuery: string
  enabled: boolean
  isBelowMinLength: boolean
}

function resolveInitialQueryBehavior(config: QueryDependentLoaderConfig):
  | {
      value: string
      loadWhen: 'needed' | 'parent-open'
    }
  | false {
  if (config.initialQueryBehavior !== undefined) {
    if (config.initialQueryBehavior === false) {
      return false
    }
    return {
      value: config.initialQueryBehavior.value ?? '',
      loadWhen: config.initialQueryBehavior.loadWhen ?? 'needed',
    }
  }

  if (config.initialQuery !== undefined) {
    return { value: config.initialQuery, loadWhen: 'needed' }
  }

  return { value: '', loadWhen: 'needed' }
}

function resolveQueryExecutionState(
  config: QueryDependentLoaderConfig,
  query: string,
): QueryExecutionState {
  const minLength = config.minQueryLength ?? 1
  const initialQueryBehavior = resolveInitialQueryBehavior(config)

  if (query.length >= minLength) {
    return {
      effectiveQuery: query,
      enabled: true,
      isBelowMinLength: false,
    }
  }

  if (initialQueryBehavior !== false) {
    return {
      effectiveQuery: initialQueryBehavior.value,
      enabled: true,
      isBelowMinLength: false,
    }
  }

  return {
    effectiveQuery: '',
    enabled: false,
    isBelowMinLength: true,
  }
}

function getAsyncLoaderIdForBranch(
  node: SubmenuDef | SubpageDef,
  breadcrumbs: BreadcrumbNode[],
): string {
  return [
    ...breadcrumbs.map((breadcrumb) => normalizeValue(breadcrumb.value)),
    normalizeValue(node.value),
  ].join('.')
}

/**
 * Renders an async loader component and registers its state with the coordinator.
 * This component exists solely to call the Loader component (which contains hooks).
 */
function AsyncLoaderRenderer({
  info,
  query,
  enabled,
}: AsyncLoaderRendererProps) {
  const coordinator = useAsyncMenuCoordinator()
  const { config, id, breadcrumbs } = info
  const Loader = config.Loader

  const queryExecution = React.useMemo(() => {
    if (config.type !== 'query') {
      return null
    }

    return resolveQueryExecutionState(config, query)
  }, [config, query])

  const effectiveQuery = queryExecution?.effectiveQuery ?? query
  const shouldFetch = queryExecution?.enabled ?? true

  // Track if this loader should be active
  const isActive = enabled || shouldLoadEagerly(config)

  if (!isActive) {
    return null
  }

  return (
    <Loader query={effectiveQuery} enabled={shouldFetch}>
      {(result) => (
        <AsyncLoaderResultHandler
          id={id}
          breadcrumbs={breadcrumbs}
          config={config}
          result={result}
          coordinator={coordinator}
        />
      )}
    </Loader>
  )
}

interface AsyncLoaderResultHandlerProps {
  id: string
  breadcrumbs: string[]
  config: AsyncNodesConfig
  result: AsyncLoaderResult<NodeDef[]>
  coordinator: ReturnType<typeof useAsyncMenuCoordinator>
}

/**
 * Handles registering and updating loader results with the coordinator.
 * This is a separate component to avoid re-rendering the Loader on every result change.
 */
function AsyncLoaderResultHandler({
  id,
  breadcrumbs,
  config,
  result,
  coordinator,
}: AsyncLoaderResultHandlerProps) {
  // Use refs to hold the latest values without causing re-renders
  // This is critical because coordinator changes on every state update (new Map)
  const breadcrumbsRef = React.useRef(breadcrumbs)
  const configRef = React.useRef(config)
  const coordinatorRef = React.useRef(coordinator)
  const resultRef = React.useRef(result)

  // Track previous result values to avoid unnecessary updates
  // TanStack Query returns new object references on every render
  const prevResultRef = React.useRef<{
    data: unknown
    status: string
    fetchStatus: string
    loadingPhase: string
    isLoading: boolean
    isFetching: boolean
    isInitialLoading: boolean
    isRefetching: boolean
    isPending: boolean
    isSuccess: boolean
    isError: boolean
    isPaused: boolean
    hasData: boolean
    hasFetched: boolean
    error: Error | null
  } | null>(null)

  // Keep refs up to date
  breadcrumbsRef.current = breadcrumbs
  configRef.current = config
  coordinatorRef.current = coordinator
  resultRef.current = result

  // Register on mount, unregister on unmount
  // IMPORTANT: Only depend on `id` - coordinator is accessed via ref to avoid
  // infinite loops (coordinator object changes on every state update)
  React.useEffect(() => {
    const coord = coordinatorRef.current
    if (!coord) return

    const state: AsyncMenuState = {
      id,
      breadcrumbs: breadcrumbsRef.current,
      config: configRef.current,
      result: resultRef.current,
    }

    coord.registerLoader(state)

    return () => {
      coord.unregisterLoader(id)
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update result when meaningful values change
  // IMPORTANT: Depend on individual result values, not the result object reference.
  // TanStack Query creates new object references on every render, but we only want
  // to trigger updates when actual values change.
  // Using coordinatorRef prevents re-running when coordinator context changes.
  React.useEffect(() => {
    const coord = coordinatorRef.current
    if (!coord) return

    // Compare against previous values to avoid unnecessary updates
    const prev = prevResultRef.current
    const hasChanged =
      prev === null ||
      prev.data !== result.data ||
      prev.status !== result.status ||
      prev.fetchStatus !== result.fetchStatus ||
      prev.loadingPhase !== result.loadingPhase ||
      prev.isLoading !== result.isLoading ||
      prev.isFetching !== result.isFetching ||
      prev.isInitialLoading !== result.isInitialLoading ||
      prev.isRefetching !== result.isRefetching ||
      prev.isPending !== result.isPending ||
      prev.isSuccess !== result.isSuccess ||
      prev.isError !== result.isError ||
      prev.isPaused !== result.isPaused ||
      prev.hasData !== result.hasData ||
      prev.hasFetched !== result.hasFetched ||
      prev.error !== result.error

    if (hasChanged) {
      prevResultRef.current = {
        data: result.data,
        status: result.status,
        fetchStatus: result.fetchStatus,
        loadingPhase: result.loadingPhase,
        isLoading: result.isLoading,
        isFetching: result.isFetching,
        isInitialLoading: result.isInitialLoading,
        isRefetching: result.isRefetching,
        isPending: result.isPending,
        isSuccess: result.isSuccess,
        isError: result.isError,
        isPaused: result.isPaused,
        hasData: result.hasData,
        hasFetched: result.hasFetched,
        error: result.error,
      }
      coord.updateLoaderResult(id, result)
    }
  }, [
    id,
    result.data,
    result.status,
    result.fetchStatus,
    result.loadingPhase,
    result.isLoading,
    result.isFetching,
    result.isInitialLoading,
    result.isRefetching,
    result.isPending,
    result.isSuccess,
    result.isError,
    result.isPaused,
    result.hasData,
    result.hasFetched,
    result.error,
  ]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

// ============================================================================
// Root Async Loader Component
// ============================================================================

interface RootAsyncLoaderProps {
  query: string
}

/**
 * Renders the root async content loader if configured.
 */
function RootAsyncLoader({ query }: RootAsyncLoaderProps) {
  const dataSurfaceCtx = useDataSurfaceContext()
  const coordinator = useAsyncMenuCoordinator()
  const { asyncContent } = dataSurfaceCtx

  const queryExecution = React.useMemo(() => {
    if (!asyncContent || asyncContent.type !== 'query') {
      return null
    }

    return resolveQueryExecutionState(asyncContent, query)
  }, [asyncContent, query])

  const effectiveQuery = queryExecution?.effectiveQuery ?? query
  const shouldFetch = queryExecution?.enabled ?? true

  if (!asyncContent) {
    return null
  }

  const Loader = asyncContent.Loader

  return (
    <Loader query={effectiveQuery} enabled={shouldFetch}>
      {(result) => (
        <AsyncLoaderResultHandler
          id="__root__"
          breadcrumbs={[]}
          config={asyncContent as AsyncNodesConfig}
          result={result}
          coordinator={coordinator}
        />
      )}
    </Loader>
  )
}

// ============================================================================
// DataList Component
// ============================================================================

export interface PopupMenuDataListProps extends DataListProps {
  /** Render function for custom element */
  render?: React.ReactElement
}

/**
 * DataList renders the menu items using a render prop pattern.
 * It reads from the store for search and computes filtered nodes.
 *
 * Place inside PopupMenuDataSurface.
 * Wraps PopupMenuList for keyboard navigation and accessibility.
 */
export const PopupMenuDataList = React.forwardRef<
  HTMLDivElement,
  PopupMenuDataList.Props
>(function PopupMenuDataList(props, forwardedRef) {
  // Get data surface context for content and deep search config
  const dataSurfaceCtx = useDataSurfaceContext()
  const {
    content,
    asyncContent,
    deepSearchConfig,
    includeInDeepSearch,
    getQualifiedRowId,
  } = dataSurfaceCtx

  // Get store from surface context for search state
  const { store } = useSurfaceContext()
  const search = store.useState('search')
  const normalizedSearch = store.useState('normalizedSearch')

  return (
    <DataListInner
      ref={forwardedRef}
      {...props}
      content={content}
      asyncContent={asyncContent}
      deepSearchConfig={deepSearchConfig}
      includeInDeepSearch={includeInDeepSearch}
      getQualifiedRowId={getQualifiedRowId}
      search={search}
      normalizedSearch={normalizedSearch}
      store={store}
    />
  )
})

// ============================================================================
// DataList Inner Component (with coordinator access)
// ============================================================================

interface DataListInnerProps extends PopupMenuDataListProps {
  content: NodeDef[]
  asyncContent: ReturnType<typeof useDataSurfaceContext>['asyncContent']
  deepSearchConfig: ReturnType<typeof useDataSurfaceContext>['deepSearchConfig']
  includeInDeepSearch: ReturnType<
    typeof useDataSurfaceContext
  >['includeInDeepSearch']
  getQualifiedRowId: GetQualifiedRowIdFn
  search: string
  normalizedSearch: string
  store: ReturnType<typeof useSurfaceContext>['store']
}

const DataListInner = React.forwardRef<HTMLDivElement, DataListInnerProps>(
  function DataListInner(props, forwardedRef) {
    const {
      children,
      label = 'Menu',
      className,
      style,
      render,
      measureRowWidth,
      maxRowWidth,
      content,
      asyncContent,
      deepSearchConfig,
      includeInDeepSearch,
      getQualifiedRowId,
      search,
      normalizedSearch,
      store,
    } = props

    // Get coordinator for async state
    const coordinator = useAsyncMenuCoordinator()

    // Collect async submenus from content
    const asyncSubmenus = React.useMemo(
      () => collectAsyncSubmenus(content, [], includeInDeepSearch),
      [content, includeInDeepSearch],
    )

    // Determine if deep search is active
    const minLength = deepSearchConfig.minLength ?? 0
    const isDeepSearchActive =
      deepSearchConfig.enabled !== false && normalizedSearch.length >= minLength

    // Determine which async loaders should be rendered
    const shouldRenderAsyncLoaders =
      isDeepSearchActive ||
      asyncSubmenus.some((s) => shouldLoadEagerly(s.config)) ||
      (asyncContent && asyncContent.loadStrategy === 'eager')

    // Get async nodes from coordinator
    const asyncNodes = React.useMemo(() => {
      if (!coordinator) return []
      return coordinator.getAsyncNodes()
    }, [coordinator, coordinator?.loaders])

    // Merge async nodes into content tree
    const mergedContent = React.useMemo(() => {
      if (asyncNodes.length === 0) return content
      return mergeAsyncNodesIntoTree(content, asyncNodes)
    }, [content, asyncNodes])

    // Handle root async content if available
    const contentWithRootAsync = React.useMemo(() => {
      const rootAsyncData = asyncNodes.find((n) => n.id === '__root__')
      if (!rootAsyncData) return mergedContent

      // When asyncContent is provided, it's the sole data source - use only its results
      if (asyncContent) {
        return rootAsyncData.nodes
      }

      // For root-level DataSurface without asyncContent, append to static content
      return [...mergedContent, ...rootAsyncData.nodes]
    }, [mergedContent, asyncNodes, asyncContent])

    const streamOrderRef = React.useRef<{
      query: string
      order: string[]
    } | null>(null)

    // Compute filtered display nodes and set composite IDs
    const { displayNodes, isDeepSearching } = React.useMemo(() => {
      const result = filterNodes({
        query: normalizedSearch,
        normalizeQuery: identityQuery,
        nodes: contentWithRootAsync,
        highlightedId: null, // Primitives handle highlighting via store
        deepSearch: deepSearchConfig.enabled,
        includeInDeepSearch,
        minLength: deepSearchConfig.minLength,
        groupSearchBehavior: deepSearchConfig.groupSearchBehavior,
        radioGroupSearchBehavior: deepSearchConfig.radioGroupSearchBehavior,
        sortGroups: deepSearchConfig.sortGroups,
      })

      const asyncResultBehavior =
        deepSearchConfig.asyncResultBehavior ?? 'stream'
      const expectedAsyncLoaderCount =
        asyncSubmenus.length + (asyncContent ? 1 : 0)
      const hasAsyncSources = expectedAsyncLoaderCount > 0

      const shouldBlockAsyncResults =
        asyncResultBehavior === 'block' &&
        result.isDeepSearching &&
        hasAsyncSources &&
        coordinator !== null &&
        (coordinator.loaders.size < expectedAsyncLoaderCount ||
          coordinator.isAnyLoading)

      let displayNodesToRender = result.displayNodes

      if (shouldBlockAsyncResults) {
        streamOrderRef.current = null
        displayNodesToRender = []
      } else if (asyncResultBehavior === 'stream' && result.isDeepSearching) {
        const previousStreamState = streamOrderRef.current

        if (
          !previousStreamState ||
          previousStreamState.query !== normalizedSearch
        ) {
          streamOrderRef.current = {
            query: normalizedSearch,
            order: displayNodesToRender.map(getDisplayNodeStreamKey),
          }
        } else {
          const { orderedNodes, nextOrder } = orderDisplayNodesForStreaming(
            displayNodesToRender,
            previousStreamState.order,
          )

          displayNodesToRender = orderedNodes
          streamOrderRef.current = {
            query: normalizedSearch,
            order: nextOrder,
          }
        }
      } else {
        streamOrderRef.current = null
      }

      // Set composite IDs directly on the freshly created display nodes
      computeItemIds(
        displayNodesToRender,
        getQualifiedRowId,
        result.isDeepSearching,
      )

      return {
        displayNodes: displayNodesToRender,
        isDeepSearching: result.isDeepSearching,
      }
    }, [
      normalizedSearch,
      contentWithRootAsync,
      deepSearchConfig,
      includeInDeepSearch,
      getQualifiedRowId,
      asyncSubmenus.length,
      asyncContent,
      coordinator,
      coordinator?.isAnyLoading,
      coordinator?.loaders,
    ])

    // Sync orderedItems with the store when display nodes change
    // This is needed because DataSurface sets filter={false} on the underlying Surface
    //
    // We use a ref to track the previous IDs and do a deep comparison to avoid
    // triggering highlight resets when the content hasn't actually changed.
    const prevOrderedItemIdsRef = React.useRef<string[]>([])
    const prevOrderedItemsSearchRef = React.useRef<string | null>(null)
    const orderedItemsUpdateReasonRef = React.useRef<'replace' | 'append'>(
      'replace',
    )

    // Compute new ordered IDs using composite IDs
    const newOrderedItemIds = React.useMemo(
      () => getOrderedItemIds(displayNodes),
      [displayNodes],
    )

    // Memoize the ordered IDs, only returning a new array if content changed
    const orderedItemIds = React.useMemo(() => {
      const prev = prevOrderedItemIdsRef.current
      const current = newOrderedItemIds

      // Deep comparison
      const changed =
        prev.length !== current.length ||
        prev.some((id, i) => id !== current[i])

      if (changed) {
        const asyncResultBehavior =
          deepSearchConfig.asyncResultBehavior ?? 'stream'
        const shouldUseAppendReason =
          asyncResultBehavior === 'stream' &&
          isDeepSearching &&
          prevOrderedItemsSearchRef.current === normalizedSearch &&
          isAppendOnlyOrderedItemsUpdate(prev, current)

        orderedItemsUpdateReasonRef.current = shouldUseAppendReason
          ? 'append'
          : 'replace'
        prevOrderedItemIdsRef.current = current
        prevOrderedItemsSearchRef.current = normalizedSearch
        return current
      }

      return prev
    }, [
      newOrderedItemIds,
      deepSearchConfig.asyncResultBehavior,
      isDeepSearching,
      normalizedSearch,
    ])

    React.useEffect(() => {
      store.setOrderedItems(orderedItemIds, {
        reason: orderedItemsUpdateReasonRef.current,
      })
    }, [store, orderedItemIds])

    // Helper to render a single row node (item, checkbox item, submenu, or subpage)
    // biome-ignore lint/correctness/useExhaustiveDependencies: renderRowNode and renderRadioGroup are intentionally recursive.
    const renderRowNode = React.useCallback(
      (displayNode: DisplayRowNode): React.ReactNode => {
        const { node, context } = displayNode

        // Use composite ID from display node, fallback to node.id/value for nested children
        const compositeId = displayNode.compositeId ?? node.id ?? node.value

        const getBranchAsyncState = (branchNode: SubmenuDef | SubpageDef) => {
          if (!branchNode.asyncNodes || !coordinator) {
            return undefined
          }

          const asyncLoaderId = getAsyncLoaderIdForBranch(
            branchNode,
            context.breadcrumbs,
          )
          const asyncResult = coordinator.loaders.get(asyncLoaderId)

          if (!asyncResult) {
            return undefined
          }

          const isBelowMinLength =
            branchNode.asyncNodes.type === 'query'
              ? resolveQueryExecutionState(
                  branchNode.asyncNodes,
                  normalizedSearch,
                ).isBelowMinLength
              : false

          return {
            status: asyncResult.result.status,
            fetchStatus: asyncResult.result.fetchStatus,
            loadingPhase: asyncResult.result.loadingPhase,
            isLoading: asyncResult.result.isLoading,
            isFetching: asyncResult.result.isFetching,
            isInitialLoading: asyncResult.result.isInitialLoading,
            isRefetching: asyncResult.result.isRefetching,
            isError: asyncResult.result.isError,
            error: asyncResult.result.error,
            isBelowMinLength,
          }
        }

        if (node.kind === 'item') {
          return (
            <React.Fragment key={compositeId}>
              {node.render({
                props: {
                  id: compositeId,
                  value: node.value,
                  disabled: node.disabled ?? false,
                  closeOnClick: node.closeOnClick,
                  onSelect: node.onSelect,
                  shortcut: node.shortcut,
                  forceOrder: node.forceOrder,
                  forceScore: node.forceScore,
                },
                context: {
                  ...context,
                  value: node.value,
                  disabled: node.disabled ?? false,
                },
              })}
            </React.Fragment>
          )
        }

        if (node.kind === 'radio-item') {
          return (
            <React.Fragment key={compositeId}>
              {node.render({
                props: {
                  id: compositeId,
                  value: node.value,
                  disabled: node.disabled ?? false,
                  closeOnClick: node.closeOnClick,
                  onSelect: node.onSelect,
                  shortcut: node.shortcut,
                  forceOrder: node.forceOrder,
                  forceScore: node.forceScore,
                },
                context: {
                  ...context,
                  value: node.value,
                  disabled: node.disabled ?? false,
                },
              })}
            </React.Fragment>
          )
        }

        if (node.kind === 'checkbox-item') {
          return (
            <React.Fragment key={compositeId}>
              {node.render({
                props: {
                  id: compositeId,
                  value: node.value,
                  checked: node.checked,
                  onCheckedChange: node.onCheckedChange,
                  disabled: node.disabled ?? false,
                  closeOnClick: node.closeOnClick,
                  forceOrder: node.forceOrder,
                  forceScore: node.forceScore,
                },
                context: {
                  ...context,
                  value: node.value,
                  checked: node.checked,
                  disabled: node.disabled ?? false,
                },
              })}
            </React.Fragment>
          )
        }

        if (node.kind === 'submenu') {
          // For submenus, provide the nodes and a recursive renderNode function
          // Note: We pass the compositeId to the submenu trigger so it registers with the
          // correct ID for keyboard navigation during deep search
          const submenuAsyncState = getBranchAsyncState(node)

          // Static nodes only - async content is handled by the submenu's own DataSurface
          const staticNodes = node.nodes ?? []

          // Create breadcrumb node for current submenu (used in child contexts)
          const submenuBreadcrumb: BreadcrumbNode = {
            node,
            value: node.value,
            id: node.id,
          }

          const submenuRenderNode = (childNode: NodeDef): React.ReactNode => {
            // Skip separators
            if (childNode.kind === 'separator') {
              return null
            }

            // Handle groups - render the group with its children
            if (childNode.kind === 'group') {
              const groupItems = childNode.nodes.filter(
                (n): n is ItemDef | CheckboxItemDef | SubmenuDef | SubpageDef =>
                  (n.kind === 'item' ||
                    n.kind === 'checkbox-item' ||
                    n.kind === 'submenu' ||
                    n.kind === 'subpage') &&
                  !n.hidden,
              )

              if (groupItems.length === 0) {
                return null
              }

              // Render group items - renderRowNode already wraps in keyed Fragment
              const groupChildren = groupItems.map((item) => {
                const itemContext: RowRenderContext = {
                  search: null,
                  breadcrumbs: [...context.breadcrumbs, submenuBreadcrumb],
                  isDeepSearchResult: false,
                  highlighted: false,
                  disabled: item.disabled ?? false,
                  group: { id: childNode.id, label: childNode.label },
                }

                return renderRowNode({ node: item, context: itemContext })
              })

              // Use custom group render if provided
              if (childNode.render) {
                const groupContext: GroupRenderContext = {
                  search: null,
                  matchCount: groupItems.length,
                  breadcrumbs: [...context.breadcrumbs, submenuBreadcrumb],
                  isDeepSearchResult: false,
                }
                return (
                  <React.Fragment key={childNode.id}>
                    {childNode.render({
                      props: {},
                      context: {
                        ...groupContext,
                        label: childNode.label,
                      },
                      children: <>{groupChildren}</>,
                    })}
                  </React.Fragment>
                )
              }

              // Default group rendering
              return (
                // biome-ignore lint/a11y/useSemanticElements: ignore for now
                <div
                  key={childNode.id}
                  role="group"
                  aria-label={childNode.label}
                >
                  {groupChildren}
                </div>
              )
            }

            // Handle radio groups inside submenus
            if (childNode.kind === 'radio-group') {
              return renderRadioGroup(childNode, [
                ...context.breadcrumbs,
                submenuBreadcrumb,
              ])
            }

            // Handle items, checkbox items, submenus, and subpages
            if (
              childNode.kind !== 'item' &&
              childNode.kind !== 'checkbox-item' &&
              childNode.kind !== 'submenu' &&
              childNode.kind !== 'subpage'
            ) {
              return null
            }

            // Create context for child node (no deep search in submenu)
            const childContext: RowRenderContext = {
              search: null,
              breadcrumbs: [...context.breadcrumbs, submenuBreadcrumb],
              isDeepSearchResult: false,
              highlighted: false,
              disabled: childNode.disabled ?? false,
              group: null,
            }

            // renderRowNode already wraps in a keyed Fragment
            return renderRowNode({
              node: childNode,
              context: childContext,
            })
          }

          return (
            <React.Fragment key={compositeId}>
              {node.render({
                props: {
                  id: compositeId,
                  value: node.value,
                  disabled: node.disabled ?? false,
                  forceOrder: node.forceOrder,
                  forceScore: node.forceScore,
                },
                context: {
                  ...context,
                  value: node.value,
                  disabled: node.disabled ?? false,
                  async: submenuAsyncState,
                },
                nodes: staticNodes,
                asyncContent: node.asyncNodes,
                renderNode: submenuRenderNode,
              })}
            </React.Fragment>
          )
        }

        if (node.kind === 'subpage') {
          const subpageAsyncState = getBranchAsyncState(node)
          const pageId = getSubpagePageId(node, context.breadcrumbs)

          return (
            <React.Fragment key={compositeId}>
              {node.renderTrigger({
                props: {
                  id: compositeId,
                  value: node.value,
                  disabled: node.disabled ?? false,
                  targetPageId: pageId,
                },
                context: {
                  ...context,
                  value: node.value,
                  disabled: node.disabled ?? false,
                  async: subpageAsyncState,
                },
              })}
            </React.Fragment>
          )
        }

        return null
      },
      [coordinator, normalizedSearch],
    )

    // Helper to render a radio group
    const renderRadioGroup = React.useCallback(
      (
        radioGroup: RadioGroupDef,
        breadcrumbs: BreadcrumbNode[] = [],
      ): React.ReactNode => {
        const isDeepSearchResult = breadcrumbs.length > 0

        // Build group context
        const groupContext: GroupRenderContext = {
          search: null,
          matchCount: radioGroup.nodes.length,
          breadcrumbs,
          isDeepSearchResult,
        }

        // Render children - renderRowNode already wraps in keyed Fragment
        const childElements = radioGroup.nodes.map((item) => {
          if (item.hidden) return null

          const itemContext: RowRenderContext = {
            search: null,
            breadcrumbs,
            isDeepSearchResult,
            highlighted: false,
            disabled: item.disabled ?? false,
            group: null,
          }

          return renderRowNode({
            node: item,
            context: itemContext,
            radioGroup: { id: radioGroup.id, label: radioGroup.label },
          })
        })

        // Use custom render if provided
        if (radioGroup.render) {
          return (
            <React.Fragment key={radioGroup.id}>
              {radioGroup.render({
                props: {
                  value: radioGroup.value,
                  onValueChange: radioGroup.onValueChange,
                  disabled: radioGroup.disabled ?? false,
                },
                context: {
                  ...groupContext,
                  label: radioGroup.label,
                  value: radioGroup.value,
                  disabled: radioGroup.disabled ?? false,
                },
                children: <>{childElements}</>,
              })}
            </React.Fragment>
          )
        }

        // Minimal default: just render children with a wrapper
        return (
          <div
            key={radioGroup.id}
            role="radiogroup"
            aria-label={radioGroup.label}
          >
            {childElements}
          </div>
        )
      },
      [renderRowNode],
    )

    // Build the renderNode function that handles groups, radio groups, and rows
    const renderNode: RenderNodeFn = React.useCallback(
      (displayNode: DisplayNode): React.ReactNode => {
        // Handle group display nodes
        if (isDisplayGroupNode(displayNode)) {
          const { group, context, items } = displayNode

          // Render children - renderRowNode already wraps in keyed Fragment
          const children = items.map((item) => renderRowNode(item))

          // Use custom render if provided
          if (group.render) {
            return (
              <React.Fragment key={group.id}>
                {group.render({
                  props: {},
                  context: {
                    ...context,
                    label: group.label,
                  },
                  children: <>{children}</>,
                })}
              </React.Fragment>
            )
          }

          // Minimal default: just render children with a wrapper
          return (
            // biome-ignore lint/a11y/useSemanticElements: ignore for now
            <div key={group.id} role="group" aria-label={group.label}>
              {children}
            </div>
          )
        }

        // Handle radio group display nodes
        if (isDisplayRadioGroupNode(displayNode)) {
          const { radioGroup, context, items } = displayNode

          // Render children - renderRowNode already wraps in keyed Fragment
          const children = items.map((item) => renderRowNode(item))

          // Use custom render if provided
          if (radioGroup.render) {
            return (
              <React.Fragment key={radioGroup.id}>
                {radioGroup.render({
                  props: {
                    value: radioGroup.value,
                    onValueChange: radioGroup.onValueChange,
                    disabled: radioGroup.disabled ?? false,
                  },
                  context: {
                    ...context,
                    label: radioGroup.label,
                    value: radioGroup.value,
                    disabled: radioGroup.disabled ?? false,
                  },
                  children: <>{children}</>,
                })}
              </React.Fragment>
            )
          }

          // Minimal default: just render children with a wrapper
          return (
            <div
              key={radioGroup.id}
              role="radiogroup"
              aria-label={radioGroup.label}
            >
              {children}
            </div>
          )
        }

        // Handle separator display nodes
        if (isDisplaySeparatorNode(displayNode)) {
          const { separator } = displayNode

          // Use custom render if provided
          if (separator.render) {
            return (
              <React.Fragment key={separator.id ?? 'separator'}>
                {separator.render({
                  props: { id: separator.id },
                })}
              </React.Fragment>
            )
          }

          // Minimal default: render a div with role="none"
          return <div key={separator.id ?? 'separator'} role="none" />
        }

        // Handle row display nodes (items/checkbox items/submenus/subpages)
        // renderRowNode already wraps in keyed Fragment
        return renderRowNode(displayNode)
      },
      [renderRowNode],
    )

    // Get async state from coordinator
    const asyncState = React.useMemo(() => {
      if (!coordinator) {
        return {
          isLoading: false,
          isFetching: false,
          isInitialLoading: false,
          isRefetching: false,
          isAllRefetching: false,
          isStaticLoading: false,
          isStaticInitialLoading: false,
          isStaticRefetching: false,
          isQueryLoading: false,
          isQueryInitialLoading: false,
          isQueryRefetching: false,
          skippedMenus: [] as Array<{
            id: string
            reason: 'error'
          }>,
        }
      }
      return coordinator.getAsyncState()
    }, [coordinator, coordinator?.loaders, coordinator?.erroredLoaders])

    // Build children state
    const childrenState: DataListChildrenState = React.useMemo(
      () => ({
        search,
        nodes: displayNodes,
        renderNode,
        count: displayNodes.length,
        isDeepSearching,
        async: asyncState,
      }),
      [search, displayNodes, renderNode, isDeepSearching, asyncState],
    )

    const renderedChildren = children(childrenState)

    // Use PopupMenuList which handles keyboard navigation
    return (
      <>
        {/* Render async loaders (hidden, just for hook execution) */}
        {shouldRenderAsyncLoaders && (
          <>
            {/* Root async content loader */}
            <RootAsyncLoader query={normalizedSearch} />

            {/* Submenu async loaders */}
            {asyncSubmenus.map((info) => (
              <AsyncLoaderRenderer
                key={info.id}
                info={info}
                query={normalizedSearch}
                enabled={isDeepSearchActive}
              />
            ))}
          </>
        )}

        <PopupMenuList
          ref={forwardedRef}
          label={label}
          className={className}
          style={style}
          render={render}
          measureRowWidth={measureRowWidth}
          maxRowWidth={maxRowWidth}
        >
          {renderedChildren}
        </PopupMenuList>
      </>
    )
  },
)

export namespace PopupMenuDataList {
  export interface Props extends PopupMenuDataListProps {}
  export type ChildrenState = DataListChildrenState
}
