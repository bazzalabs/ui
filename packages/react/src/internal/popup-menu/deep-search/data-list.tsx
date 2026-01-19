'use client'

import * as React from 'react'
import { useSurfaceContext } from '../../listbox/index.js'
import { PopupMenuList } from '../components/list/list.js'
import { type RenderNodeFn, useDataSurfaceContext } from './context.js'
import type {
  CheckboxItemDef,
  DataListChildrenState,
  DataListProps,
  DisplayNode,
  DisplayRowNode,
  GroupRenderContext,
  ItemDef,
  NodeDef,
  RadioGroupDef,
  RowRenderContext,
  SubmenuDef,
} from './types.js'
import {
  isDisplayGroupNode,
  isDisplayRadioGroupNode,
  isDisplaySeparatorNode,
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
  const { content, deepSearchConfig } = dataSurfaceCtx

  // Get store from surface context for search state
  const { store } = useSurfaceContext()
  const search = store.useState('search')

  // Compute filtered display nodes
  // Note: We don't include highlightedId in dependencies - primitives handle their own highlighting
  const { displayNodes, isDeepSearching } = React.useMemo(() => {
    const result = filterNodes({
      query: search,
      nodes: content,
      highlightedId: null, // Primitives handle highlighting via store
      deepSearch: deepSearchConfig.enabled,
      minLength: deepSearchConfig.minLength,
      groupSearchBehavior: deepSearchConfig.groupSearchBehavior,
      radioGroupSearchBehavior: deepSearchConfig.radioGroupSearchBehavior,
      sortGroups: deepSearchConfig.sortGroups,
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

      if (node.kind === 'item') {
        return (
          <React.Fragment key={node.id}>
            {node.render({
              props: {
                id: node.id,
                disabled: node.disabled ?? false,
                closeOnClick: node.closeOnSelect,
                onSelect: node.onSelect,
                shortcut: node.shortcut,
                value: node.value ?? node.id,
              },
              context: {
                ...context,
                disabled: node.disabled ?? false,
              },
            })}
          </React.Fragment>
        )
      }

      if (node.kind === 'checkbox-item') {
        return (
          <React.Fragment key={node.id}>
            {node.render({
              props: {
                id: node.id,
                checked: node.checked,
                onCheckedChange: node.onCheckedChange,
                disabled: node.disabled ?? false,
                closeOnClick: node.closeOnSelect,
              },
              context: {
                ...context,
                checked: node.checked,
                disabled: node.disabled ?? false,
              },
            })}
          </React.Fragment>
        )
      }

      if (node.kind === 'submenu') {
        // For submenus, provide the nodes and a recursive renderNode function
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
                breadcrumbs: [...context.breadcrumbs, node.title],
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
                breadcrumbs: [...context.breadcrumbs, node.title],
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
              <div key={childNode.id} role="group" aria-label={childNode.label}>
                {groupChildren}
              </div>
            )
          }

          // Handle radio groups inside submenus
          if (childNode.kind === 'radio-group') {
            return renderRadioGroup(childNode, [
              ...context.breadcrumbs,
              node.title,
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
            breadcrumbs: [...context.breadcrumbs, node.title],
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
          <React.Fragment key={node.id}>
            {node.render({
              props: {
                disabled: node.disabled ?? false,
              },
              context: {
                ...context,
                disabled: node.disabled ?? false,
              },
              nodes: node.nodes ?? [],
              renderNode: submenuRenderNode,
            })}
          </React.Fragment>
        )
      }

      return null
    },
    [],
  )

  // Helper to render a radio group
  const renderRadioGroup = React.useCallback(
    (
      radioGroup: RadioGroupDef,
      breadcrumbs: string[] = [],
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

        return renderRowNode({ node: item, context: itemContext })
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
      measureRowWidth={measureRowWidth}
      maxRowWidth={maxRowWidth}
    >
      {renderedChildren}
    </PopupMenuList>
  )
})

export namespace PopupMenuDataList {
  export interface Props extends PopupMenuDataListProps {}
  export type ChildrenState = DataListChildrenState
}
