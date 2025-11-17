import {
  defaultSlots,
  type GroupNode,
  type ItemNode,
  MenuItemPrimitive,
  MenuListPrimitive,
  mergeProps,
  type SubmenuNode,
  useFilteredNodes,
} from '@bazza-ui/menu'
import { useVirtualizer } from '@tanstack/react-virtual'
import * as React from 'react'
import { useSub } from '../contexts/submenu-context.js'
import { ScopedThemeProvider } from '../contexts/theme-context.js'
import { useNavKeydown } from '../hooks/use-nav-keydown.js'
import { PopupMenuSubmenu } from './submenu.js'
import { PopupMenuSubmenuContent } from './submenu-content.js'
import { PopupMenuSubmenuTrigger } from './submenu-trigger.js'
import { useSurface } from './surface-provider.js'

interface ListRendererProps {
  query?: string
  onClose?: () => void
  /** Callback when user starts typing to activate input */
  onTypeStart?: (seed: string) => void
}

/**
 * Wrapper component that handles loading/error states before rendering the main list.
 * This ensures we don't violate React's Rules of Hooks by returning early before
 * all hooks in ListRendererContent are called.
 */
export function ListRenderer(props: ListRendererProps) {
  const { menu, slots: customSlots } = useSurface()
  const { query = '' } = props
  const slots = React.useMemo(
    () => ({ ...defaultSlots(), ...customSlots }),
    [customSlots],
  )

  // Handle loading state
  const isStreaming = (menu as any).loadingState?.loadMode === 'streaming'
  const shouldShowLoading =
    (menu as any).loadingState?.isLoading &&
    !isStreaming &&
    ((menu as any).nodes?.length === 0 || (query && query.trim().length > 0))

  if (shouldShowLoading) {
    const LoadingSlot = slots.Loading
    if (LoadingSlot) {
      return LoadingSlot({
        isFetching: (menu as any).loadingState?.isFetching,
        progress: (menu as any).loadingState?.progress,
        query,
        loadMode: (menu as any).loadingState?.loadMode,
      } as any) as React.ReactElement
    }
    return null
  }

  // Handle error state
  if ((menu as any).loadingState?.isError) {
    const ErrorSlot = slots.Error
    if (ErrorSlot) {
      return ErrorSlot({
        error: (menu as any).loadingState.error ?? undefined,
      } as any) as React.ReactElement
    }
    return null
  }

  return <ListRendererContent {...props} />
}

/**
 * Main list renderer component with all hooks called unconditionally.
 * This component is only rendered when we're not in loading/error states.
 */
function ListRendererContent({
  query = '',
  onClose,
  onTypeStart,
}: ListRendererProps) {
  const {
    store,
    menu,
    slots: customSlots,
    classNames,
    onSubmenuSelect,
  } = useSurface()
  const sub = useSub()

  // Determine surface ID from submenu context or default to 'root'
  const surfaceId = React.useMemo(() => sub?.childSurfaceId ?? 'root', [sub])

  // Use centralized keyboard navigation hook
  const navKeyDown = useNavKeydown('list', surfaceId, onClose)

  const slots = React.useMemo(
    () => ({ ...defaultSlots(), ...customSlots }),
    [customSlots],
  )

  const q = React.useMemo(() => query.trim(), [query])

  // Check for streaming mode
  const isStreaming = (menu as any).loadingState?.loadMode === 'streaming'
  const completionOrder = (menu as any).loadingState?.completionOrder as
    | string[]
    | undefined

  // Use the menu primitive hook to filter, score, and sort nodes
  // When searching (query exists), use 'deep' mode to search through nested submenus
  // When browsing (no query), use 'shallow' mode to preserve hierarchical structure with nested Popover components
  const { displayNodes } = useFilteredNodes(menu, q, {
    mode: q.length > 0 ? 'deep' : 'shallow',
    streamingEnabled: isStreaming,
    completionOrder: completionOrder ?? [],
  })

  // Update store with valid row IDs
  React.useEffect(() => {
    const validRows = displayNodes.filter(
      (n) =>
        (n.kind === 'item' || n.kind === 'submenu') && !(n as any).disabled,
    )
    const validRowIds = validRows.map((n) => n.id)
    const virtualIndexMap = new Map<string, number>()

    displayNodes.forEach((node, index) => {
      if (node.kind === 'item' || node.kind === 'submenu') {
        virtualIndexMap.set(node.id, index)
      }
    })

    store.resetOrder(validRowIds)
    store.resetVirtualIndexMap(virtualIndexMap)

    const activeId = store.snapshot().activeId
    const isActiveIdValid = activeId !== null && validRowIds.includes(activeId)

    if (validRowIds.length > 0 && !isActiveIdValid) {
      store.setActiveByIndex(0, 'keyboard')
    }
  }, [displayNodes, store])

  // Reset to first item when query changes
  React.useEffect(() => {
    store.first('keyboard')
  }, [q, store])

  // Virtualization - enable if configured or if many items
  const virtualizationConfig = (menu as any).virtualization
  const enableVirtualization =
    virtualizationConfig?.enabled ||
    (virtualizationConfig?.enabled !== false && displayNodes.length > 50)

  const virtualizer = useVirtualizer({
    count: displayNodes.length,
    estimateSize: virtualizationConfig?.estimateSize ?? (() => 40),
    getScrollElement: () => store.listRef.current,
    getItemKey: (index) => displayNodes[index]?.id ?? index,
    overscan: virtualizationConfig?.overscan ?? 5,
    enabled: enableVirtualization,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  // Store virtualizer ref for keyboard navigation
  React.useEffect(() => {
    if (store.virtualizerRef && enableVirtualization) {
      ;(store.virtualizerRef as any).current = virtualizer
    }
  }, [store.virtualizerRef, virtualizer, enableVirtualization])

  // Handle item selection
  const handleItemSelect = React.useCallback(
    ({ node }: { node: ItemNode<any> }) => {
      if (node.onSelect && !node.disabled) {
        node.onSelect({ node })
      }
    },
    [],
  )

  // Handle submenu selection
  const handleSubmenuSelect = React.useCallback(
    ({ node }: { node: SubmenuNode<any> }) => {
      if (node.child && onSubmenuSelect) {
        onSubmenuSelect(node.id, node.def as any)
      }
    },
    [onSubmenuSelect],
  )

  // Combine navigation keyboard handler with type-to-search
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      // First, handle navigation keys via the centralized hook
      navKeyDown(e)

      // Then, handle type-to-search if not already handled
      if (!onTypeStart || e.defaultPrevented) return

      const { key } = e
      // Check if it's a printable character (not a navigation or control key)
      if (
        key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        key !== ' ' // Exclude space as it's used for selection
      ) {
        onTypeStart(key)
      }
    },
    [navKeyDown, onTypeStart],
  )

  // Helper function to render a single node
  const renderNode = React.useCallback(
    (
      node: any,
      index: number,
      virtualRow?: { key: string | number; start: number },
    ) => {
      // Extract key separately to avoid spreading it (React requirement)
      const key = virtualRow ? virtualRow.key : node.id
      const wrapperProps = virtualRow
        ? {
            'data-index': index,
            ref: virtualizer.measureElement,
            style: {
              position: 'absolute' as const,
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            },
          }
        : {
            'data-index': index,
          }

      if (!node) return null

      // Group heading
      if (node.kind === 'group') {
        const groupNode = node as GroupNode<any>
        const GroupHeadingSlot = slots.GroupHeading
        if (!GroupHeadingSlot) return null
        return (
          <div key={key} {...wrapperProps}>
            {GroupHeadingSlot({
              node: groupNode,
              bind: {
                getGroupHeadingProps: (overrides) =>
                  mergeProps(
                    {
                      role: 'presentation',
                      className: classNames?.groupHeading,
                    },
                    overrides as any,
                  ),
              },
            })}
          </div>
        )
      }

      // Separator
      if (node.kind === 'separator') {
        const SeparatorSlot = slots.Separator
        if (!SeparatorSlot) return null
        return (
          <div key={key} {...wrapperProps}>
            {SeparatorSlot({ node })}
          </div>
        )
      }

      // Item
      if (node.kind === 'item') {
        const ItemSlot = slots.Item
        const itemNode = node as ItemNode<any>

        const itemElement = (
          <MenuItemPrimitive
            key={node.id}
            node={itemNode}
            store={store}
            className={classNames?.item}
            mode="popover"
            onSelect={handleItemSelect}
          >
            {(bind) =>
              ItemSlot({
                node: itemNode,
                bind,
                search: itemNode.search,
              })
            }
          </MenuItemPrimitive>
        )

        return virtualRow ? (
          <div key={key} {...wrapperProps}>
            {itemElement}
          </div>
        ) : (
          itemElement
        )
      }

      // Submenu
      if (node.kind === 'submenu') {
        const SubmenuTriggerSlot = slots.SubmenuTrigger
        const submenuNode = node as SubmenuNode<any>

        const submenuElement = (
          <ScopedThemeProvider
            key={node.id}
            __scopeId={node.id}
            theme={node.ui as any}
          >
            <PopupMenuSubmenu def={submenuNode.def}>
              <PopupMenuSubmenuTrigger
                node={submenuNode}
                slot={SubmenuTriggerSlot}
                classNames={classNames}
                search={submenuNode.search}
              />
              <PopupMenuSubmenuContent node={submenuNode} />
            </PopupMenuSubmenu>
          </ScopedThemeProvider>
        )

        return virtualRow ? (
          <div key={key} {...wrapperProps}>
            {submenuElement}
          </div>
        ) : (
          submenuElement
        )
      }

      // Loading node
      if (node.kind === 'loading') {
        const InlineLoadingSlot = slots.InlineLoading
        if (!InlineLoadingSlot) return null

        return (
          <div key={key} {...wrapperProps}>
            {InlineLoadingSlot({
              progress: (node as any).progress,
              inProgressPaths: (node as any).inProgressPaths,
              completedPaths: (node as any).completedPaths,
              query: q,
            })}
          </div>
        )
      }

      return null
    },
    [
      store,
      slots,
      classNames,
      handleItemSelect,
      handleSubmenuSelect,
      q,
      virtualizer,
    ],
  )

  // Show empty state
  if (displayNodes.length === 0) {
    const EmptySlot = slots.Empty
    return EmptySlot ? (EmptySlot({ query: q }) as React.ReactElement) : null
  }

  return (
    <MenuListPrimitive
      store={store}
      role="listbox"
      className={classNames?.list}
      onKeyDown={handleKeyDown}
      style={{
        maxHeight: '400px',
        overflow: 'auto',
      }}
      data-slot="popup-menu-list"
      data-popup-menu-list={true}
    >
      {enableVirtualization ? (
        <div
          style={{
            height: `${totalSize}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const node = displayNodes[virtualRow.index]
            return renderNode(node, virtualRow.index, {
              key: String(virtualRow.key),
              start: virtualRow.start,
            })
          })}
        </div>
      ) : (
        displayNodes.map((node, index) => renderNode(node, index))
      )}
    </MenuListPrimitive>
  )
}
