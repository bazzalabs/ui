'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useAimGuard } from '../contexts/aim-guard-context.js'
import { useRootContext } from '../contexts/root-context.js'
import {
  useGroupContext,
  useSurfaceContext,
} from '../contexts/surface-context.js'

export interface DropdownMenuItemState extends Record<string, unknown> {
  /**
   * Whether the item is highlighted (via keyboard or pointer).
   */
  highlighted: boolean
  /**
   * Whether the item is disabled.
   */
  disabled: boolean
}

export interface DropdownMenuItemProps
  extends ComponentProps<'div', DropdownMenuItemState> {
  /**
   * Unique value for this item used for filtering.
   * If not provided, will be inferred from textContent.
   */
  value?: string

  /**
   * Additional keywords to match against when filtering.
   * Useful for aliases or synonyms.
   */
  keywords?: string[]

  /**
   * Whether this item is disabled.
   * Disabled items are not selectable and are skipped during keyboard navigation.
   */
  disabled?: boolean

  /**
   * Callback when this item is selected (via click or Enter key).
   */
  onSelect?: () => void

  /**
   * Whether to force render this item regardless of filter results.
   * @default false
   */
  forceMount?: boolean

  /**
   * Whether clicking this item should close the menu.
   * @default true
   */
  closeOnClick?: boolean
}

/**
 * A selectable item in the dropdown menu.
 * Renders a `<div>` element with role="option".
 */
export const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps
>(function DropdownMenuItem(props, forwardedRef) {
  const {
    value: valueProp,
    keywords,
    disabled = false,
    onSelect,
    forceMount = false,
    closeOnClick = true,
    render,
    className,
    style,
    onClick,
    onPointerDown,
    onPointerMove,
    children,
    ...rest
  } = props

  const { store } = useSurfaceContext()
  const groupContext = useGroupContext()
  const { depth, closeAll } = useRootContext()
  const { aimGuardActiveRef, guardedDepthRef } = useAimGuard()

  const id = React.useId()
  const ref = React.useRef<HTMLDivElement>(null)

  // Infer value from textContent if not provided
  const [inferredValue, setInferredValue] = React.useState<string>('')

  React.useLayoutEffect(() => {
    if (valueProp === undefined && ref.current) {
      const textContent = ref.current.textContent?.trim() ?? ''
      setInferredValue(textContent)
    }
  }, [valueProp, children])

  const value = valueProp ?? inferredValue

  // Register item with store
  React.useEffect(() => {
    if (!value && !forceMount) return

    const unregister = store.registerItem(id, {
      value,
      keywords,
      groupId: groupContext?.groupId,
      disabled,
    })

    return unregister
  }, [id, value, keywords, groupContext?.groupId, disabled, store, forceMount])

  // Register onSelect handler
  React.useEffect(() => {
    return store.registerItemSelect(id, onSelect)
  }, [id, onSelect, store])

  // Use selectors to get derived state
  const search = store.useState('search')
  const isHighlighted = store.useState('isHighlighted', id)
  const score = store.useState('getItemScore', id)

  // Determine visibility based on filter score
  const hasSearch = search.length > 0
  const isVisible = forceMount || !hasSearch || score > 0

  // Scroll into view only when highlighted via keyboard
  React.useEffect(() => {
    if (
      isHighlighted &&
      store.state.highlightSource === 'keyboard' &&
      ref.current
    ) {
      ref.current.scrollIntoView({ block: 'nearest' })
    }
  }, [isHighlighted, store])

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(event)

      if (event.defaultPrevented) return
      if (disabled) return

      event.preventDefault()
      onSelect?.()

      if (closeOnClick) {
        closeAll()
      }
    },
    [onClick, disabled, onSelect, closeOnClick, closeAll],
  )

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      onPointerDown?.(event)
    },
    [onPointerDown],
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)

      if (event.defaultPrevented) return
      if (disabled) return

      // Don't highlight if aim guard is active at this depth (user is moving toward submenu)
      // Only block highlighting in the same menu where the trigger is located
      if (aimGuardActiveRef.current && guardedDepthRef.current === depth) return

      // Highlight on hover
      store.setHighlightedId(id)
    },
    [
      onPointerMove,
      disabled,
      aimGuardActiveRef,
      guardedDepthRef,
      depth,
      store,
      id,
    ],
  )

  const state: DropdownMenuItemState = React.useMemo(
    () => ({
      highlighted: isHighlighted,
      disabled,
    }),
    [isHighlighted, disabled],
  )

  return useRender({
    render,
    ref: [ref, forwardedRef],
    state,
    props: {
      ...rest,
      id,
      role: 'option',
      tabIndex: -1,
      'aria-selected': isHighlighted,
      'aria-disabled': disabled || undefined,
      className,
      style,
      onClick: handleClick,
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
      children,
    },
    enabled: isVisible,
    defaultTagName: 'div',
  })
})

export namespace DropdownMenuItem {
  export type State = DropdownMenuItemState
  export interface Props extends DropdownMenuItemProps {}
}
