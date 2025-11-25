import { mergeProps } from '@bazza-ui/theming'
import { composeRefs } from '@radix-ui/react-compose-refs'
import type { VirtualItem } from '@tanstack/react-virtual'
import * as React from 'react'
import { type StoreApi, useStore } from 'zustand'
import type { BaseMenuStore, SurfaceRefs } from '../store/types.js'
import type { ItemNode, RowBindAPI, SearchContext } from '../types.js'

export const SELECT_ITEM_EVENT = 'bazza-ui:menu:item-select'

export interface MenuItemPrimitiveProps<T> {
  /** Reference to the HTML element */
  ref?: React.Ref<HTMLElement>
  /** Virtual item for virtualized rendering */
  virtualItem?: VirtualItem
  /** Item node */
  node: ItemNode<T>
  /** Surface ID for this item */
  surfaceId: string
  /** Global store API */
  globalStore: StoreApi<BaseMenuStore<T>>
  /** Search context */
  search?: SearchContext
  /** Additional className */
  className?: string
  /** Display mode (popover/drawer/modal) */
  mode?: 'popover' | 'drawer' | 'modal'
  /** Optional menu control for accessing menu-wide state (disabled, loading, etc.) */
  control?: import('../control.js').MenuControl<T>
  /** onSelect handler */
  onSelect?: (args: { node: ItemNode<T>; search?: SearchContext }) => void
  /** Children renderer */
  children: (bind: RowBindAPI) => React.ReactNode
}

/**
 * Primitive menu item component that provides:
 * - data-focused attribute based on active ID
 * - ARIA attributes (role, aria-selected, aria-checked, aria-disabled)
 * - Focus management and keyboard navigation
 * - Event handlers for pointer/mouse/click
 * - Row registration with global store
 */
export function MenuItemPrimitive<T>({
  ref: refProp,
  virtualItem,
  node,
  surfaceId,
  globalStore,
  search,
  className,
  mode = 'popover',
  control,
  onSelect,
  children,
}: MenuItemPrimitiveProps<T>) {
  const ref = React.useRef<HTMLElement | null>(null)
  const rowId = node.id

  // Get checked state for checkbox/radio
  const checked =
    node.variant === 'checkbox'
      ? (node as any).checked
      : node.variant === 'radio'
        ? node.group?.variant === 'radio' && node.group.value === node.id
        : undefined

  // Check menu-wide disabled state from control (if provided)
  const menuDisabled = control?.getState().disabled ?? false

  // Combine: menu-wide OR node-level disabled
  const disabled = menuDisabled || node.disabled || false

  // Handle selection
  const handleSelect = React.useCallback(() => {
    if (disabled) return

    if (node.variant === 'checkbox') {
      // Toggle checkbox
      ;(node as any).onCheckedChange?.(!checked)
    } else if (node.variant === 'radio') {
      // Set radio value
      if (node.group?.variant === 'radio') {
        node.group.onValueChange(node.id)
      }
    }

    onSelect?.({ node, search })
  }, [node, checked, disabled, onSelect, search])

  // Listen for custom select event from keyboard navigation
  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleSelectEvent: EventListener = () => {
      handleSelect()
    }

    el.addEventListener(SELECT_ITEM_EVENT, handleSelectEvent)
    return () => el.removeEventListener(SELECT_ITEM_EVENT, handleSelectEvent)
  }, [handleSelect])

  // Register row with global store
  React.useEffect(() => {
    globalStore.getState().registerRow(surfaceId, rowId, {
      ref: ref as any,
      virtualItem,
      disabled,
      kind: 'item',
    })
    return () => globalStore.getState().unregisterRow(surfaceId, rowId)
  }, [globalStore, surfaceId, rowId, disabled, virtualItem])

  // Subscribe to surface's activeId from global store
  const activeId = useStore(
    globalStore,
    React.useCallback(
      (state: BaseMenuStore<T>) =>
        state.surfaces.get(surfaceId)?.activeId ?? null,
      [surfaceId],
    ),
  )

  const focused = activeId === rowId

  // Subscribe to surface existence so we re-render when surface is registered
  const surfaceExists = useStore(
    globalStore,
    React.useCallback(
      (state: BaseMenuStore<T>) => state.surfaces.has(surfaceId),
      [surfaceId],
    ),
  )

  // Get refs from global store - re-evaluate when surface exists changes
  const refs = React.useMemo<SurfaceRefs | undefined>(
    () =>
      surfaceExists
        ? globalStore.getState().getSurfaceRefs(surfaceId)
        : undefined,
    [globalStore, surfaceId, surfaceExists],
  )

  // Event handlers
  const onPointerDown = React.useCallback((e: React.PointerEvent) => {
    e.preventDefault()
  }, [])

  const onMouseMove = React.useCallback(() => {
    if (disabled) return
    if (refs?.ignorePointerRef.current) return
    if (!focused)
      globalStore.getState().setSurfaceActiveId(surfaceId, rowId, 'pointer')
  }, [disabled, focused, globalStore, surfaceId, rowId, refs])

  const onClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled) return
      handleSelect()
    },
    [disabled, handleSelect],
  )

  // Check if this is a submenu trigger
  const isSubmenuTrigger = 'child' in node

  // Base row props
  const baseRowProps = React.useMemo(() => {
    return {
      id: rowId,
      ref: composeRefs(refProp as any, ref as any),
      role:
        node.variant === 'checkbox' || node.variant === 'radio'
          ? ('menuitemcheckbox' as const)
          : ('option' as const),
      tabIndex: -1,
      'data-menu-item': '',
      'data-index': virtualItem?.index,
      'data-menu-item-id': rowId,
      'data-focused': focused,
      'data-variant': node.variant,
      'data-checked': checked,
      'data-disabled': disabled,
      'data-submenu-trigger': isSubmenuTrigger || undefined,
      'aria-selected': focused,
      'aria-checked': checked,
      'aria-disabled': disabled,
      disabled,
      'data-mode': mode,
      className,
      onPointerDown,
      onMouseMove,
      onClick,
    } as const
  }, [
    rowId,
    virtualItem?.index,
    refProp,
    focused,
    node.variant,
    checked,
    disabled,
    isSubmenuTrigger,
    mode,
    className,
    onPointerDown,
    onMouseMove,
    onClick,
  ])

  const bind: RowBindAPI = React.useMemo(
    () => ({
      focused,
      disabled,
      getRowProps: (overrides) =>
        mergeProps(baseRowProps as any, overrides as any),
    }),
    [focused, disabled, baseRowProps],
  )

  return <>{children(bind)}</>
}

/**
 * Trigger SELECT_ITEM_EVENT on an element to select it
 */
export function triggerItemSelect(element: HTMLElement) {
  element.dispatchEvent(new CustomEvent(SELECT_ITEM_EVENT, { bubbles: false }))
}
