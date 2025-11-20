import {
  defaultSlots,
  type GroupNode,
  type ItemNode,
  MenuItemPrimitive,
  MenuListPrimitive,
  type SubmenuNode,
  useFilteredNodes,
} from '@bazza-ui/menu'
import { mergeProps } from '@bazza-ui/theming'
import { useVirtualizer } from '@tanstack/react-virtual'
import * as React from 'react'
import { useCommandMenuContext } from '../context.js'
import { useSurface } from './surface-provider.js'

interface ListRendererProps {
  query?: string
  onQueryChange?: (query: string) => void
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
  // Show loading when:
  // 1. Initial load without data (nodes.length === 0)
  // 2. Deep search in BLOCKING mode (query exists, indicating deep search is active)
  // In STREAMING mode, we show results as they come in, not a blocking loading screen
  const isStreaming = (menu as any).loadingState?.loadMode === 'streaming'
  const shouldShowLoading =
    (menu as any).loadingState?.isLoading &&
    !isStreaming &&
    (menu.nodes.length === 0 || (query && query.trim().length > 0))

  if (shouldShowLoading) {
    const LoadingSlot = slots.Loading
    if (LoadingSlot) {
      return LoadingSlot({
        menu,
        isFetching: (menu as any).loadingState?.isFetching,
        progress: (menu as any).loadingState?.progress,
        query,
        loadMode: (menu as any).loadingState?.loadMode,
      }) as React.ReactElement
    }
    return null
  }

  // Handle error state
  if ((menu as any).loadingState?.isError) {
    const ErrorSlot = slots.Error
    if (ErrorSlot) {
      return ErrorSlot({
        menu,
        error: (menu as any).loadingState.error ?? undefined,
      }) as React.ReactElement
    }
    return null
  }

  return <ListRendererContent {...props} />
}

/**
 * Main list renderer component with all hooks called unconditionally.
 * This component is only rendered when we're not in loading/error states.
 */
function ListRendererContent({ query = '' }: ListRendererProps) {
  const {
    store,
    menu,
    slots: customSlots,
    classNames,
    onSubmenuSelect,
  } = useSurface()
  const { vimBindings, dir, popSubmenu, isInSubmenu, onOpenChange } =
    useCommandMenuContext()

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
  const { displayNodes } = useFilteredNodes(menu, q, {
    mode: 'deep',
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
  }, [q])

  // Virtualization
  const virtualizer = useVirtualizer({
    count: displayNodes.length,
    estimateSize: () => 40,
    getScrollElement: () => store.listRef.current,
    getItemKey: (index) => displayNodes[index]?.id ?? index,
    overscan: 5,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  // Handle item selection
  const handleItemSelect = React.useCallback(
    ({ node }: { node: ItemNode<any> }) => {
      if (node.disabled) return

      // Call the item's onSelect handler
      if (node.onSelect) {
        node.onSelect({ node })
      }

      // For command menus (modal dialogs), default to closing on select for button items
      // unless explicitly set to false. Checkbox/radio items default to staying open.
      const defaultCloseOnSelect = node.variant === 'button'
      const closeOnSelect = node.closeOnSelect ?? defaultCloseOnSelect

      // Close the command menu if closeOnSelect is true
      if (closeOnSelect) {
        onOpenChange(false)
      }
    },
    [onOpenChange],
  )

  // Handle submenu selection - push to stack
  const handleSubmenuSelect = React.useCallback(
    ({ node }: { node: SubmenuNode<any> }) => {
      if (node.child && onSubmenuSelect) {
        // IMPORTANT: Pass node.def (SubmenuDef) not node.child (Menu instance)
        // The SubmenuDef has __originalLoader preserved from deep search injection
        onSubmenuSelect(node.id, node.def as any)
      }
    },
    [onSubmenuSelect],
  )

  // Handle submenu open via keyboard (Enter/Right arrow on submenu item)
  const handleSubmenuOpen = React.useCallback(
    (activeId: string | null) => {
      if (!activeId) return

      // Find the submenu node
      const activeNode = displayNodes.find((n) => n.id === activeId)
      if (activeNode && activeNode.kind === 'submenu') {
        const submenuNode = activeNode as SubmenuNode<any>
        if (submenuNode.child && onSubmenuSelect) {
          // IMPORTANT: Pass submenuNode.def (SubmenuDef) not submenuNode.child (Menu instance)
          // The SubmenuDef has __originalLoader preserved from deep search injection
          onSubmenuSelect(submenuNode.id, submenuNode.def as any)
        }
      }
    },
    [displayNodes, onSubmenuSelect],
  )

  // Handle back navigation via keyboard (Left arrow)
  const handleClose = React.useCallback(() => {
    if (isInSubmenu) {
      popSubmenu()
    }
  }, [isInSubmenu, popSubmenu])

  // Handle Escape key - close the dialog
  const handleEscape = React.useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // Show empty state
  if (displayNodes.length === 0) {
    const EmptySlot = slots.Empty
    return EmptySlot({ query: q }) as React.ReactElement
  }

  return (
    <MenuListPrimitive
      store={store}
      role="listbox"
      className={classNames?.list}
      vimBindings={vimBindings}
      dir={dir}
      onEscape={handleEscape}
      onClose={handleClose}
      onSubmenuOpen={handleSubmenuOpen}
      style={{
        height: '100%',
        maxHeight: '400px',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const node = displayNodes[virtualRow.index]
          if (!node) return null

          // Group heading
          if (node.kind === 'group') {
            const groupNode = node as GroupNode<any>
            const GroupHeadingSlot = slots.GroupHeading
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
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
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {SeparatorSlot({ node })}
              </div>
            )
          }

          // Item
          if (node.kind === 'item') {
            const ItemSlot = slots.Item
            const itemNode = node as ItemNode<any>

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <MenuItemPrimitive
                  node={itemNode}
                  store={store}
                  virtualItem={virtualRow}
                  className={classNames?.item}
                  mode="modal"
                  onSelect={handleItemSelect}
                >
                  {(bind) =>
                    ItemSlot({
                      node: itemNode,
                      bind,
                      search: (node as any).search,
                    })
                  }
                </MenuItemPrimitive>
              </div>
            )
          }

          // Submenu
          if (node.kind === 'submenu') {
            const SubmenuTriggerSlot = slots.SubmenuTrigger
            const submenuNode = node as SubmenuNode<any>

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <MenuItemPrimitive
                  node={submenuNode as any}
                  store={store}
                  virtualItem={virtualRow}
                  className={classNames?.item}
                  mode="modal"
                  onSelect={handleSubmenuSelect as any}
                >
                  {(bind) =>
                    SubmenuTriggerSlot({
                      node: submenuNode,
                      bind,
                      search: (node as any).search,
                    })
                  }
                </MenuItemPrimitive>
              </div>
            )
          }

          // Loading node (streaming mode only)
          if (node.kind === 'loading') {
            const InlineLoadingSlot = slots.InlineLoading
            if (!InlineLoadingSlot) return null

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
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
        })}
      </div>
    </MenuListPrimitive>
  )
}
