'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useContextMenuInternal } from '../root/root.js'
import { ContextMenuTriggerDataAttributes } from './trigger.data-attrs.js'

// Long-press delay in milliseconds
const LONG_PRESS_DELAY = 500
// Movement threshold to cancel long-press (in pixels)
const MOVE_THRESHOLD = 10

export interface ContextMenuTriggerState extends Record<string, unknown> {
  /**
   * Whether the context menu is currently open.
   */
  open: boolean
  /**
   * Whether the trigger is currently being pressed (long-press in progress).
   */
  pressed: boolean
  /**
   * Whether the trigger is disabled.
   */
  disabled: boolean
}

export interface ContextMenuTriggerProps
  extends ComponentProps<'div', ContextMenuTrigger.State> {
  /**
   * Whether the trigger is disabled.
   * When disabled, right-click and long-press will not open the menu.
   * @default false
   */
  disabled?: boolean
}

const stateAttributesMapping = {
  open: (value: unknown): Record<string, string> | null =>
    value ? { [ContextMenuTriggerDataAttributes.popupOpen]: '' } : null,
  pressed: (value: unknown): Record<string, string> | null =>
    value ? { [ContextMenuTriggerDataAttributes.pressed]: '' } : null,
  disabled: (value: unknown): Record<string, string> | null =>
    value ? { [ContextMenuTriggerDataAttributes.disabled]: '' } : null,
}

/**
 * An area that opens the context menu on right-click or long-press.
 * Renders a `<div>` element.
 */
export const ContextMenuTrigger = React.forwardRef<
  HTMLDivElement,
  ContextMenuTrigger.Props
>(function ContextMenuTrigger(props, forwardedRef) {
  const {
    disabled: disabledProp = false,
    render,
    className,
    style,
    onContextMenu,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    children,
    ...rest
  } = props

  const {
    setAnchorPosition,
    openMenu,
    disabled: rootDisabled,
    open,
  } = useContextMenuInternal()

  const disabled = disabledProp || rootDisabled

  // Long-press state
  const [pressed, setPressed] = React.useState(false)
  const longPressTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null)
  const touchStartPosRef = React.useRef<{ x: number; y: number } | null>(null)

  // Cleanup long-press timeout
  const clearLongPressTimeout = React.useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
    setPressed(false)
  }, [])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearLongPressTimeout()
    }
  }, [clearLongPressTimeout])

  // Handle right-click (contextmenu event)
  const handleContextMenu = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onContextMenu?.(event)

      if (event.defaultPrevented) return
      if (disabled) return

      // Prevent default browser context menu
      event.preventDefault()

      // Set anchor at cursor position
      setAnchorPosition(event.clientX, event.clientY, false)

      // Open the menu
      openMenu()
    },
    [onContextMenu, disabled, setAnchorPosition, openMenu],
  )

  // Handle touch start (begin long-press detection)
  const handleTouchStart = React.useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      onTouchStart?.(event)

      if (event.defaultPrevented) return
      if (disabled) return

      const touch = event.touches[0]
      if (!touch) return

      // Store initial touch position
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY }
      setPressed(true)

      // Start long-press timer
      longPressTimeoutRef.current = setTimeout(() => {
        if (!touchStartPosRef.current) return

        // Set anchor at touch position
        setAnchorPosition(
          touchStartPosRef.current.x,
          touchStartPosRef.current.y,
          true,
        )

        // Open the menu
        openMenu()

        // Reset state
        setPressed(false)
        touchStartPosRef.current = null
      }, LONG_PRESS_DELAY)
    },
    [onTouchStart, disabled, setAnchorPosition, openMenu],
  )

  // Handle touch move (cancel if moved too far)
  const handleTouchMove = React.useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      onTouchMove?.(event)

      if (!touchStartPosRef.current) return

      const touch = event.touches[0]
      if (!touch) return

      // Calculate distance moved
      const dx = touch.clientX - touchStartPosRef.current.x
      const dy = touch.clientY - touchStartPosRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Cancel if moved beyond threshold
      if (distance > MOVE_THRESHOLD) {
        clearLongPressTimeout()
        touchStartPosRef.current = null
      }
    },
    [onTouchMove, clearLongPressTimeout],
  )

  // Handle touch end (cleanup)
  const handleTouchEnd = React.useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      onTouchEnd?.(event)
      clearLongPressTimeout()
      touchStartPosRef.current = null
    },
    [onTouchEnd, clearLongPressTimeout],
  )

  // Handle touch cancel (cleanup)
  const handleTouchCancel = React.useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      onTouchCancel?.(event)
      clearLongPressTimeout()
      touchStartPosRef.current = null
    },
    [onTouchCancel, clearLongPressTimeout],
  )

  const state: ContextMenuTrigger.State = React.useMemo(
    () => ({
      open,
      pressed,
      disabled,
    }),
    [open, pressed, disabled],
  )

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      [ContextMenuTriggerDataAttributes.slot]: '',
      onContextMenu: handleContextMenu,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
      className,
      style: {
        // Prevent native iOS callout on long-press
        WebkitTouchCallout: 'none',
        // Prevent text selection on long-press
        WebkitUserSelect: 'none',
        userSelect: 'none',
        ...style,
      },
      children,
    },
    defaultTagName: 'div',
  })
})

export namespace ContextMenuTrigger {
  export type State = ContextMenuTriggerState
  export interface Props extends ContextMenuTriggerProps {}
}
