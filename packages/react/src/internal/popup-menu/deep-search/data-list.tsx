'use client'

import * as React from 'react'
import { useSurfaceContext } from '../../listbox/index.js'
import { PopupMenuList } from '../components/list/list.js'
import { type RenderNodeFn, useDataSurfaceContext } from './context.js'
import type {
  DataListChildrenState,
  DataListProps,
  DisplayNode,
  NodeDef,
  RowRenderContext,
} from './types.js'
import { filterNodes, getNavigableIds } from './utils.js'

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
  PopupMenuDataListProps
>(function PopupMenuDataList(props, forwardedRef) {
  const { children, label = 'Menu', className, style, render } = props

  // Get data surface context for content and deep search config
  const dataSurfaceCtx = useDataSurfaceContext()
  const { content, deepSearchConfig, listId } = dataSurfaceCtx

  // Get store from surface context for search state
  const { store } = useSurfaceContext()
  const search = store.useState('search')

  // Debug: track renders
  const renderCountRef = React.useRef(0)
  renderCountRef.current++
  console.log('[DataList] render #' + renderCountRef.current, { search })

  // Compute filtered display nodes
  // Note: We don't include highlightedId in dependencies - primitives handle their own highlighting
  const { displayNodes, isDeepSearching } = React.useMemo(() => {
    const result = filterNodes({
      query: search,
      nodes: content,
      highlightedId: null, // Primitives handle highlighting via store
      deepSearch: deepSearchConfig.enabled,
      minLength: deepSearchConfig.minLength,
    })

    return result
  }, [search, content, deepSearchConfig])

  // Sync orderedItems with the store when display nodes change
  // This is needed because DataSurface sets filter={false} on the underlying Surface
  //
  // We use a ref to track the previous IDs and do a deep comparison to avoid
  // triggering highlight resets when the content hasn't actually changed.
  const prevOrderedItemIdsRef = React.useRef<string[]>([])

  // Compute new ordered IDs
  const newOrderedItemIds = React.useMemo(
    () => getNavigableIds(displayNodes),
    [displayNodes],
  )

  // Memoize the ordered IDs, only returning a new array if content changed
  const orderedItemIds = React.useMemo(() => {
    const prev = prevOrderedItemIdsRef.current
    const current = newOrderedItemIds

    // Deep comparison
    const changed =
      prev.length !== current.length || prev.some((id, i) => id !== current[i])

    if (changed) {
      console.log('[DataList] orderedItemIds CHANGED:', { prev, current })
      prevOrderedItemIdsRef.current = current
      return current
    }

    console.log('[DataList] orderedItemIds unchanged, returning prev ref')
    return prev
  }, [newOrderedItemIds])

  React.useEffect(() => {
    console.log('[DataList] setOrderedItems effect running')
    store.setOrderedItems(orderedItemIds)
  }, [store, orderedItemIds])

  // Build the renderNode function
  const renderNode: RenderNodeFn = React.useCallback(
    (displayNode: DisplayNode) => {
      const { node, context } = displayNode

      if (node.kind === 'item') {
        return node.render({ context })
      }

      if (node.kind === 'submenu') {
        // For submenus, provide the nodes and a recursive renderNode function
        const submenuRenderNode = (childNode: NodeDef): React.ReactNode => {
          if (childNode.kind !== 'item' && childNode.kind !== 'submenu') {
            return null
          }

          // Create context for child node (no deep search in submenu)
          const childContext: RowRenderContext = {
            search: null,
            breadcrumbs: [...context.breadcrumbs, node.title],
            isDeepSearchResult: false,
            highlighted: false,
            disabled: childNode.disabled ?? false,
          }

          return renderNode({
            node: childNode,
            context: childContext,
          })
        }

        return node.render({
          context,
          nodes: node.nodes ?? [],
          renderNode: submenuRenderNode,
        })
      }

      return null
    },
    [],
  )

  // Build children state
  const childrenState: DataListChildrenState = React.useMemo(
    () => ({
      search,
      nodes: displayNodes,
      renderNode,
      count: displayNodes.length,
      isDeepSearching,
    }),
    [search, displayNodes, renderNode, isDeepSearching],
  )

  const renderedChildren = children(childrenState)

  // Use PopupMenuList which handles keyboard navigation
  return (
    <PopupMenuList
      ref={forwardedRef}
      label={label}
      className={className}
      style={style}
      render={render}
    >
      {renderedChildren}
    </PopupMenuList>
  )
})

export namespace PopupMenuDataList {
  export interface Props extends PopupMenuDataListProps {}
  export type ChildrenState = DataListChildrenState
}
