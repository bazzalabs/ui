'use client'

import * as React from 'react'
import { useSurfaceContext } from '../../listbox/index.js'
import { PopupMenuList } from '../components/list/list.js'
import {
  AsyncMenuCoordinatorProvider,
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
  DisplayRadioGroupNode,
  DisplayRowNode,
  GetQualifiedRowIdFn,
  GroupRenderContext,
  ItemDef,
  NodeDef,
  RadioGroupDef,
  RadioItemDef,
  RowRenderContext,
  SubmenuDef,
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
  mergeAsyncNodesIntoTree,
  shouldIncludeInDeepSearch,
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

// ============================================================================
// Async Loader Component
// ============================================================================

interface AsyncLoaderRendererProps {
  info: AsyncSubmenuInfo
  query: string
  enabled: boolean
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
  const { config, id, breadcrumbs, node } = info
  const Loader = config.Loader

  // For query-dependent loaders, determine effective query
  const effectiveQuery = React.useMemo(() => {
    if (config.type === 'query') {
      const minLength = config.minQueryLength ?? 1
      if (query.length < minLength) {
        return ''
      }
    }
    return query
  }, [config, query])

  // Track if this loader should be active
  const isActive = enabled || shouldLoadEagerly(config)

  if (!isActive) {
    return null
  }

  return (
    <Loader query={effectiveQuery}>
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
    isLoading: boolean
    isError: boolean
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
      prev.isLoading !== result.isLoading ||
      prev.isError !== result.isError ||
      prev.error !== result.error

    if (hasChanged) {
      prevResultRef.current = {
        data: result.data,
        isLoading: result.isLoading,
        isError: result.isError,
        error: result.error,
      }
      coord.updateLoaderResult(id, result)
    }
  }, [id, result.data, result.isLoading, result.isError, result.error]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // For query-dependent loaders, determine effective query
  const effectiveQuery = React.useMemo(() => {
    if (!asyncContent) return ''
    if (asyncContent.type === 'query') {
      const minLength = asyncContent.minQueryLength ?? 1
      if (query.length < minLength) {
        return ''
      }
    }
    return query
  }, [asyncContent, query])

  if (!asyncContent) {
    return null
  }

  const Loader = asyncContent.Loader

  return (
    <Loader query={effectiveQuery}>
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
  const {
    children,
    label = 'Menu',
    className,
    style,
    render,
    measureRowWidth,
    maxRowWidth,
  } = props

  // Get data surface context for content and deep search config
  const dataSurfaceCtx = useDataSurfaceContext()
  const { content, asyncContent, deepSearchConfig, getQualifiedRowId } =
    dataSurfaceCtx

  // Get store from surface context for search state
  const { store } = useSurfaceContext()
  const search = store.useState('search')

  // Wrap with coordinator provider
  return (
    <AsyncMenuCoordinatorProvider searchQuery={search}>
      <DataListInner
        ref={forwardedRef}
        {...props}
        content={content}
        asyncContent={asyncContent}
        deepSearchConfig={deepSearchConfig}
        getQualifiedRowId={getQualifiedRowId}
        search={search}
        store={store}
      />
    </AsyncMenuCoordinatorProvider>
  )
})

// ============================================================================
// DataList Inner Component (with coordinator access)
// ============================================================================

interface DataListInnerProps extends PopupMenuDataListProps {
  content: NodeDef[]
  asyncContent: ReturnType<typeof useDataSurfaceContext>['asyncContent']
  deepSearchConfig: ReturnType<typeof useDataSurfaceContext>['deepSearchConfig']
  getQualifiedRowId: GetQualifiedRowIdFn
  search: string
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
      getQualifiedRowId,
      search,
      store,
    } = props

    // Get coordinator for async state
    const coordinator = useAsyncMenuCoordinator()

    // Collect async submenus from content
    const asyncSubmenus = React.useMemo(
      () => collectAsyncSubmenus(content),
      [content],
    )

    // Determine if deep search is active
    const minLength = deepSearchConfig.minLength ?? 0
    const isDeepSearchActive =
      deepSearchConfig.enabled !== false && search.length >= minLength

    // Determine which async loaders should be rendered
    const shouldRenderAsyncLoaders =
      isDeepSearchActive ||
      asyncSubmenus.some((s) => shouldLoadEagerly(s.config)) ||
      (asyncContent &&
        (asyncContent.type === 'static'
          ? asyncContent.loadStrategy === 'eager'
          : asyncContent.initialQuery !== undefined))

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

    // Compute filtered display nodes and set composite IDs
    const { displayNodes, isDeepSearching } = React.useMemo(() => {
      const result = filterNodes({
        query: search,
        nodes: contentWithRootAsync,
        highlightedId: null, // Primitives handle highlighting via store
        deepSearch: deepSearchConfig.enabled,
        minLength: deepSearchConfig.minLength,
        groupSearchBehavior: deepSearchConfig.groupSearchBehavior,
        radioGroupSearchBehavior: deepSearchConfig.radioGroupSearchBehavior,
        sortGroups: deepSearchConfig.sortGroups,
      })
      // Set composite IDs directly on the freshly created display nodes
      computeItemIds(
        result.displayNodes,
        getQualifiedRowId,
        result.isDeepSearching,
      )
      return result
    }, [search, contentWithRootAsync, deepSearchConfig, getQualifiedRowId])

    // Sync orderedItems with the store when display nodes change
    // This is needed because DataSurface sets filter={false} on the underlying Surface
    //
    // We use a ref to track the previous IDs and do a deep comparison to avoid
    // triggering highlight resets when the content hasn't actually changed.
    const prevOrderedItemIdsRef = React.useRef<string[]>([])

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
        prevOrderedItemIdsRef.current = current
        return current
      }

      return prev
    }, [newOrderedItemIds])

    React.useEffect(() => {
      store.setOrderedItems(orderedItemIds)
    }, [store, orderedItemIds])

    // Helper to render a single row node (item, checkbox item, or submenu)
    const renderRowNode = React.useCallback(
      (displayNode: DisplayRowNode): React.ReactNode => {
        const { node, context } = displayNode

        // Use composite ID from display node, fallback to node.id/value for submenu children
        const compositeId = displayNode.compositeId ?? node.id ?? node.value

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

          // Get async state for this submenu if it has asyncNodes
          let submenuAsyncState:
            | {
                isLoading: boolean
                isError: boolean
                error: Error | null
                isBelowMinLength?: boolean
              }
            | undefined
          if (node.asyncNodes && coordinator) {
            const asyncResult = coordinator.loaders.get(compositeId)
            if (asyncResult) {
              const isBelowMinLength =
                node.asyncNodes.type === 'query' &&
                search.length < (node.asyncNodes.minQueryLength ?? 1)
              submenuAsyncState = {
                isLoading: asyncResult.result.isLoading,
                isError: asyncResult.result.isError,
                error: asyncResult.result.error,
                isBelowMinLength,
              }
            }
          }

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
                (n): n is ItemDef | CheckboxItemDef | SubmenuDef =>
                  (n.kind === 'item' ||
                    n.kind === 'checkbox-item' ||
                    n.kind === 'submenu') &&
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

            // Handle items, checkbox items, and submenus
            if (
              childNode.kind !== 'item' &&
              childNode.kind !== 'checkbox-item' &&
              childNode.kind !== 'submenu'
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

        return null
      },
      [coordinator, search],
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

        // Handle row display nodes (items/checkbox items/submenus)
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
          isStaticLoading: false,
          isQueryLoading: false,
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
            <RootAsyncLoader query={search} />

            {/* Submenu async loaders */}
            {asyncSubmenus.map((info) => (
              <AsyncLoaderRenderer
                key={info.id}
                info={info}
                query={search}
                enabled={
                  isDeepSearchActive && shouldIncludeInDeepSearch(info.config)
                }
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
