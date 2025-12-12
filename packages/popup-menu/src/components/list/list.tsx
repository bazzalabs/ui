import {
  type GroupNode,
  type ItemNode,
  isItemNode,
  isSubmenuNode,
  MenuListPrimitive,
  type Node,
  type SubmenuNode,
  useStickyRowWidth,
} from '@bazza-ui/menu'
import { mergeProps } from '@bazza-ui/theming'
import { useVirtualizer } from '@tanstack/react-virtual'
import * as React from 'react'
import { useRoot } from '../../contexts/root-context.js'
import { ScopedThemeProvider } from '../../contexts/theme-context.js'
import {
  useDisplayNodes,
  useInputActive,
  usePopupMenuActions,
  usePopupMenuStoreApi,
  useSurfaceMenu,
  useSurfaceQuery,
  useSurfaceRefs,
} from '../../store/index.js'
import type { PopupMenuSlots, PopupSubmenuNode } from '../../types.js'
import { PopupMenuSubmenu } from '../submenu/popup-menu-submenu.js'
import { PopupMenuSubmenuContent } from '../submenu/submenu-content.js'
import { PopupMenuSubmenuTrigger } from '../submenu/submenu-trigger.js'
import { useSurface } from '../surface/surface-provider.js'
import { PopupMenuItem } from './item.js'

export interface ListProps {
  onTypeStart?: (seed: string) => void
}

export function List<T = unknown>({ onTypeStart }: ListProps) {
  const {
    surfaceId,
    control,
    slots: customSlots,
    classNames,
    onSubmenuSelect,
  } = useSurface()

  // Get state from global store hooks
  const menu = useSurfaceMenu<T>(surfaceId)
  const displayNodes = useDisplayNodes<T>(surfaceId)
  const query = useSurfaceQuery(surfaceId)
  const inputActive = useInputActive(surfaceId)
  const surfaceRefs = useSurfaceRefs(surfaceId)
  const storeActions = usePopupMenuActions()
  const globalStoreApi = usePopupMenuStoreApi()

  const rootCtx = useRoot()

  const slots = customSlots

  // Cache menu and displayNodes so they persist during exit animation
  const cachedMenuRef = React.useRef(menu)
  const cachedDisplayNodesRef = React.useRef(displayNodes)
  if (menu) {
    cachedMenuRef.current = menu
    cachedDisplayNodesRef.current = displayNodes
  }
  const effectiveMenu = menu ?? cachedMenuRef.current
  const effectiveDisplayNodes = menu
    ? displayNodes
    : cachedDisplayNodesRef.current

  // Handle loading/error/empty states (with null guards)
  const isStreaming = effectiveMenu
    ? (effectiveMenu as any).loadingState?.loadMode === 'streaming'
    : false
  const shouldShowLoading = effectiveMenu
    ? (effectiveMenu as any).loadingState?.isLoading &&
      !isStreaming &&
      ((effectiveMenu as any).nodes?.length === 0 ||
        (query && query.trim().length > 0))
    : false

  // Compute valid row IDs (memoized to avoid unnecessary effect runs)
  const validRowIds = React.useMemo(() => {
    const validRows = displayNodes.filter(
      (n: Node<T>) =>
        (isItemNode(n) || isSubmenuNode(n)) && !n.disabled && !n.hidden,
    )
    return validRows.map((n: Node<T>) => n.id)
  }, [displayNodes])

  // Create a stable key for valid row IDs to use in effects
  const validRowIdsKey = validRowIds.join(',')

  // Update store with valid row IDs and virtual index map
  React.useEffect(() => {
    const virtualIndexMap = new Map<string, number>()

    displayNodes.forEach((node: Node<T>, index: number) => {
      if (node.kind === 'item' || node.kind === 'submenu') {
        virtualIndexMap.set(node.id, index)
      }
    })

    storeActions.resetOrder(surfaceId, validRowIds)
    storeActions.resetVirtualIndexMap(surfaceId, virtualIndexMap)
  }, [displayNodes, storeActions, surfaceId, validRowIds])

  // Track previous query and row IDs to detect actual changes
  const prevQueryRef = React.useRef(query)
  const prevValidRowIdsKeyRef = React.useRef(validRowIdsKey)

  // Set initial active ID when rows become available, or reset when query changes
  React.useEffect(() => {
    const queryChanged = prevQueryRef.current !== query
    prevQueryRef.current = query

    const rowIdsChanged = prevValidRowIdsKeyRef.current !== validRowIdsKey
    prevValidRowIdsKeyRef.current = validRowIdsKey

    if (validRowIds.length === 0) return

    const surface = globalStoreApi.getState().surfaces.get(surfaceId)
    const activeId = surface?.activeId ?? null
    const isActiveIdValid = activeId !== null && validRowIds.includes(activeId)

    // Set active ID to first item if:
    // 1. No active ID is set (initial render or rows just streamed in)
    // 2. Query changed
    // 3. Row IDs changed AND current active ID is no longer valid (was filtered out)
    if (
      activeId === null ||
      queryChanged ||
      (rowIdsChanged && !isActiveIdValid)
    ) {
      storeActions.first(surfaceId, 'keyboard')
    }
  }, [
    query,
    storeActions,
    surfaceId,
    validRowIds,
    validRowIdsKey,
    globalStoreApi,
  ])

  // Virtualization
  const virtualizationConfig = effectiveMenu?.virtualization
  const count = effectiveDisplayNodes.length

  const enableVirtualization = React.useMemo(() => {
    const enabled = virtualizationConfig?.enabled
    if (typeof enabled === 'function') {
      return enabled({
        nodes: effectiveDisplayNodes as any,
        count,
        menu: effectiveMenu as any,
      })
    }
    if (typeof enabled === 'boolean') {
      return enabled
    }
    return count >= 50
  }, [
    virtualizationConfig?.enabled,
    effectiveDisplayNodes,
    count,
    effectiveMenu,
  ])

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
    getScrollElement: () => surfaceRefs?.listRef.current ?? null,
    getItemKey: (index) => effectiveDisplayNodes[index]?.id ?? index,
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
    if (surfaceRefs?.virtualizerRef && enableVirtualization) {
      ;(surfaceRefs.virtualizerRef as any).current = virtualizer
    }
  }, [surfaceRefs?.virtualizerRef, virtualizer, enableVirtualization])

  const { queueMeasurement, resetMeasurements } = useStickyRowWidth({
    containerRef: surfaceRefs?.listRef ?? { current: null },
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
      for (let i = 0; i < effectiveDisplayNodes.length; i++) {
        const node = effectiveDisplayNodes[i]
        if (!node) continue
        if (node.kind !== 'item' && node.kind !== 'submenu') continue
        const rowEl = rowRefsMap.current.get(node.id)
        if (rowEl) {
          queueMeasurement(rowEl, node.id)
        }
      }
    } else {
      for (const virtualRow of virtualItems) {
        const node = effectiveDisplayNodes[virtualRow.index]
        if (!node) continue
        if (node.kind !== 'item' && node.kind !== 'submenu') continue
        const rowEl = rowRefsMap.current.get(node.id)
        if (rowEl) {
          queueMeasurement(rowEl, node.id)
        }
      }
    }
  }, [
    virtualItems,
    effectiveDisplayNodes,
    queueMeasurement,
    enableVirtualization,
  ])

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
      slots,
      classNames,
      handleItemSelect,
      handleSubmenuSelect,
      query,
      virtualizer,
      getRowRefCallback,
      control,
    ],
  )

  // Early return if menu has never been set
  if (!effectiveMenu) {
    return null
  }

  // Handle loading state
  if (shouldShowLoading) {
    const LoadingSlot = slots?.Loading
    if (LoadingSlot) {
      return LoadingSlot({
        menu: effectiveMenu as any,
        isFetching: (effectiveMenu as any).loadingState?.isFetching,
        progress: (effectiveMenu as any).loadingState?.progress,
        query,
        loadMode: (effectiveMenu as any).loadingState?.loadMode,
      } as any) as React.ReactElement
    }
    return null
  }

  // Handle error state
  if ((effectiveMenu as any).loadingState?.isError) {
    const ErrorSlot = slots?.Error
    if (ErrorSlot) {
      return ErrorSlot({
        menu: effectiveMenu as any,
        error: (effectiveMenu as any).loadingState.error ?? undefined,
      } as any) as React.ReactElement
    }
    return null
  }

  // Handle empty state
  if (effectiveDisplayNodes.length === 0) {
    const EmptySlot = slots?.Empty
    return EmptySlot ? (EmptySlot({ query }) as React.ReactElement) : null
  }

  return (
    <MenuListPrimitive
      surfaceId={surfaceId}
      globalStore={globalStoreApi as any}
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
            const node = effectiveDisplayNodes[virtualRow.index]
            return renderNode(node, virtualRow.index, {
              key: String(virtualRow.key),
              start: virtualRow.start,
            })
          })}
        </div>
      ) : (
        effectiveDisplayNodes.map((node, index) => renderNode(node, index))
      )}
    </MenuListPrimitive>
  )
}
