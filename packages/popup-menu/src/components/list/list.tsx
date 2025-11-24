import {
  type GroupNode,
  type ItemNode,
  MenuListPrimitive,
  type SubmenuNode,
  useStickyRowWidth,
} from '@bazza-ui/menu'
import { mergeProps } from '@bazza-ui/theming'
import { useVirtualizer } from '@tanstack/react-virtual'
import * as React from 'react'
import { useRoot } from '../../contexts/root-context.js'
import { ScopedThemeProvider } from '../../contexts/theme-context.js'
import type { PopupMenuSlots, PopupSubmenuNode } from '../../types.js'
import { PopupMenuItem } from './item.js'
import { PopupMenuSubmenu } from '../submenu/popup-menu-submenu.js'
import { PopupMenuSubmenuContent } from '../submenu/submenu-content.js'
import { PopupMenuSubmenuTrigger } from '../submenu/submenu-trigger.js'
import { useSurface } from '../surface/surface-provider.js'

export interface ListProps {
  onTypeStart?: (seed: string) => void
}

export function List({ onTypeStart }: ListProps) {
  const {
    store,
    menu,
    displayNodes,
    control,
    slots: customSlots,
    classNames,
    onSubmenuSelect,
    query,
    inputActive,
  } = useSurface()
  const rootCtx = useRoot()

  const slots = customSlots

  // Handle loading/error/empty states
  const isStreaming = (menu as any).loadingState?.loadMode === 'streaming'
  const shouldShowLoading =
    (menu as any).loadingState?.isLoading &&
    !isStreaming &&
    ((menu as any).nodes?.length === 0 || (query && query.trim().length > 0))

  if (shouldShowLoading) {
    const LoadingSlot = slots?.Loading
    if (LoadingSlot) {
      return LoadingSlot({
        menu: menu as any,
        isFetching: (menu as any).loadingState?.isFetching,
        progress: (menu as any).loadingState?.progress,
        query,
        loadMode: (menu as any).loadingState?.loadMode,
      } as any) as React.ReactElement
    }
    return null
  }

  if ((menu as any).loadingState?.isError) {
    const ErrorSlot = slots?.Error
    if (ErrorSlot) {
      return ErrorSlot({
        menu: menu as any,
        error: (menu as any).loadingState.error ?? undefined,
      } as any) as React.ReactElement
    }
    return null
  }

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
  }, [query, store])

  // Virtualization
  const virtualizationConfig = menu.virtualization
  const count = displayNodes.length

  const enableVirtualization = React.useMemo(() => {
    const enabled = virtualizationConfig?.enabled
    if (typeof enabled === 'function') {
      return enabled({
        nodes: displayNodes as any,
        count,
        menu: menu as any,
      })
    }
    if (typeof enabled === 'boolean') {
      return enabled
    }
    return count >= 50
  }, [virtualizationConfig?.enabled, displayNodes, count, menu])

  const estimateSizeFn = React.useMemo(() => {
    const estimateSize = virtualizationConfig?.estimateSize ?? 40
    if (typeof estimateSize === 'function') {
      return estimateSize
    }
    return () => estimateSize
  }, [virtualizationConfig?.estimateSize])

  const virtualizer = useVirtualizer({
    count,
    estimateSize: estimateSizeFn,
    getScrollElement: () => store.listRef.current,
    getItemKey: (index) => displayNodes[index]?.id ?? index,
    overscan: virtualizationConfig?.overscan ?? 5,
    enabled: enableVirtualization,
    horizontal: virtualizationConfig?.horizontal,
    paddingStart: virtualizationConfig?.paddingStart,
    paddingEnd: virtualizationConfig?.paddingEnd,
    scrollPaddingStart: virtualizationConfig?.scrollPaddingStart,
    scrollPaddingEnd: virtualizationConfig?.scrollPaddingEnd,
    gap: virtualizationConfig?.gap,
    initialOffset: virtualizationConfig?.initialOffset,
    scrollMargin: virtualizationConfig?.scrollMargin,
    lanes: virtualizationConfig?.lanes,
    isRtl: virtualizationConfig?.isRtl,
    debug: virtualizationConfig?.debug,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  React.useEffect(() => {
    if (store.virtualizerRef && enableVirtualization) {
      ;(store.virtualizerRef as any).current = virtualizer
    }
  }, [store.virtualizerRef, virtualizer, enableVirtualization])

  const { queueMeasurement, resetMeasurements } = useStickyRowWidth({
    containerRef: store.listRef,
  })

  React.useEffect(() => {
    return () => {
      resetMeasurements()
    }
  }, [resetMeasurements])

  const rowRefsMap = React.useRef<Map<string, HTMLElement>>(new Map())
  const rowRefCallbacks = React.useRef<
    Map<string, (el: HTMLElement | null) => void>
  >(new Map())

  const getRowRefCallback = React.useCallback((id: string) => {
    let callback = rowRefCallbacks.current.get(id)
    if (!callback) {
      callback = (el: HTMLElement | null) => {
        if (el) {
          rowRefsMap.current.set(id, el)
        } else {
          rowRefsMap.current.delete(id)
        }
      }
      rowRefCallbacks.current.set(id, callback)
    }
    return callback
  }, [])

  React.useLayoutEffect(() => {
    if (!enableVirtualization) {
      for (let i = 0; i < displayNodes.length; i++) {
        const node = displayNodes[i]
        if (!node) continue
        if (node.kind !== 'item' && node.kind !== 'submenu') continue
        const rowEl = rowRefsMap.current.get(node.id)
        if (rowEl) {
          queueMeasurement(rowEl, node.id)
        }
      }
    } else {
      for (const virtualRow of virtualItems) {
        const node = displayNodes[virtualRow.index]
        if (!node) continue
        if (node.kind !== 'item' && node.kind !== 'submenu') continue
        const rowEl = rowRefsMap.current.get(node.id)
        if (rowEl) {
          queueMeasurement(rowEl, node.id)
        }
      }
    }
  }, [virtualItems, displayNodes, queueMeasurement, enableVirtualization])

  const handleItemSelect = React.useCallback(
    ({ node }: { node: ItemNode<any> }) => {
      if (node.onSelect && !node.disabled) {
        node.onSelect({ node })
      }
      const defaultCloseOnSelect = node.variant === 'button'
      const shouldClose = node.closeOnSelect ?? defaultCloseOnSelect
      if (shouldClose) {
        rootCtx.closeAllSurfaces()
      }
    },
    [rootCtx],
  )

  const handleSubmenuSelect = React.useCallback(
    ({ node }: { node: SubmenuNode<any> }) => {
      if (onSubmenuSelect) {
        onSubmenuSelect(node.id, node.def as any)
      }
    },
    [onSubmenuSelect],
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!onTypeStart || e.defaultPrevented) return

      // When input is not active, trap focus in the list and handle typing
      if (!inputActive) {
        const { key } = e

        // Handle backspace to clear/reset search
        if (key === 'Backspace') {
          e.preventDefault()
          onTypeStart('')
          return
        }

        // Handle single character typing to activate input
        if (
          key.length === 1 &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey &&
          key !== ' '
        ) {
          e.preventDefault()
          onTypeStart(key)
          return
        }
      }
    },
    [onTypeStart, inputActive],
  )

  const renderNode = React.useCallback(
    (
      node: any,
      index: number,
      virtualRow?: { key: string | number; start: number },
    ) => {
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

      if (node.kind === 'group') {
        const groupNode = node as GroupNode<any>
        const GroupHeadingSlot = slots?.GroupHeading
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
                      'data-index': index,
                    },
                    overrides as any,
                  ),
              },
            })}
          </div>
        )
      }

      if (node.kind === 'separator') {
        const SeparatorSlot = slots?.Separator
        if (!SeparatorSlot) return null
        return (
          <div key={key} {...wrapperProps}>
            {SeparatorSlot({ node })}
          </div>
        )
      }

      if (node.kind === 'item') {
        const ItemSlot = slots?.Item as PopupMenuSlots<any>['Item']
        const itemNode = node as ItemNode<any>
        const itemElement = (
          <PopupMenuItem
            key={node.id}
            ref={getRowRefCallback(node.id)}
            node={itemNode}
            store={store}
            className={classNames?.item}
            mode="popover"
            control={control}
            onSelect={handleItemSelect}
            slot={ItemSlot}
            search={itemNode.search}
          />
        )
        return virtualRow ? (
          <div key={key} {...wrapperProps}>
            {itemElement}
          </div>
        ) : (
          itemElement
        )
      }

      if (node.kind === 'submenu') {
        const SubmenuTriggerSlot =
          slots?.SubmenuTrigger as PopupMenuSlots<any>['SubmenuTrigger']
        const submenuNode = node as PopupSubmenuNode<any>
        const submenuElement = (
          <ScopedThemeProvider
            key={node.id}
            __scopeId={node.id}
            theme={node.def.ui}
          >
            <PopupMenuSubmenu def={submenuNode.def}>
              <PopupMenuSubmenuTrigger
                ref={getRowRefCallback(node.id)}
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

      if (node.kind === 'loading') {
        const InlineLoadingSlot = slots?.InlineLoading
        if (!InlineLoadingSlot) return null
        return (
          <div key={key} {...wrapperProps}>
            {InlineLoadingSlot({
              progress: (node as any).progress,
              inProgressPaths: (node as any).inProgressPaths,
              completedPaths: (node as any).completedPaths,
              query,
            } as any)}
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
      query,
      virtualizer,
      getRowRefCallback,
    ],
  )

  if (displayNodes.length === 0) {
    const EmptySlot = slots?.Empty
    return EmptySlot ? (EmptySlot({ query }) as React.ReactElement) : null
  }

  return (
    <MenuListPrimitive
      store={store}
      role="listbox"
      className={classNames?.list}
      control={control}
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
