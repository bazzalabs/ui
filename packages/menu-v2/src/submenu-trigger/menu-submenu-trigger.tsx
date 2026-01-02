'use client'

import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
import { useMenuRootContext } from '../root/menu-root-context.js'
import { useMenuSurfaceContext } from '../surface/menu-surface-context.js'
import { useMenuSubmenuContext } from '../submenu/menu-submenu-context.js'

/**
 * State for the MenuSubmenuTrigger component
 */
export interface MenuSubmenuTriggerState extends Record<string, unknown> {
  /** Whether the item is highlighted */
  highlighted: boolean
  /** Whether the item is disabled */
  disabled: boolean
  /** Whether the submenu is open */
  open: boolean
}

/**
 * Props for the MenuSubmenuTrigger component
 */
export interface MenuSubmenuTriggerProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'className'> {
  /**
   * The content of the trigger.
   */
  children?: React.ReactNode
  /**
   * A function to customize the rendered element.
   */
  render?:
    | React.ReactElement
    | ((
        props: React.HTMLAttributes<HTMLDivElement>,
        state: MenuSubmenuTriggerState,
      ) => React.ReactElement)
  /**
   * Class name or function that returns a class name based on state.
   */
  className?: string | ((state: MenuSubmenuTriggerState) => string)
  /**
   * Whether the trigger is disabled.
   * @default false
   */
  disabled?: boolean
}

export namespace MenuSubmenuTrigger {
  export type State = MenuSubmenuTriggerState
  export type Props = MenuSubmenuTriggerProps
}

/**
 * A menu item that opens a submenu when activated.
 * Renders a `<div>` element with `role="menuitem"` and `aria-haspopup="menu"`.
 */
export const MenuSubmenuTrigger = React.forwardRef<
  HTMLDivElement,
  MenuSubmenuTrigger.Props
>(function MenuSubmenuTrigger(props, forwardedRef) {
  const { children, render, className, disabled = false, ...otherProps } = props

  const { store } = useMenuRootContext()
  const { surfaceId } = useMenuSurfaceContext()
  const { triggerId, open, setOpen, submenuId } = useMenuSubmenuContext()

  // Track if this item is highlighted
  const highlighted = store.useState('isActive', triggerId)

  // Create a ref for this item
  const itemRef = React.useRef<HTMLDivElement | null>(null)

  // Register row on mount
  React.useEffect(() => {
    store.registerRow({
      id: triggerId,
      ref: itemRef,
      disabled,
      surfaceId,
    })
    return () => {
      store.unregisterRow(triggerId)
    }
  }, [store, triggerId, disabled, surfaceId])

  // Open submenu handler
  const openSubmenu = React.useCallback(() => {
    if (disabled) return
    setOpen(true)
    // Focus first item in submenu
    requestAnimationFrame(() => {
      store.first(submenuId)
    })
  }, [disabled, setOpen, store, submenuId])

  // Close submenu handler
  const closeSubmenu = React.useCallback(() => {
    setOpen(false)
  }, [setOpen])

  // Handle click
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) {
        event.preventDefault()
        return
      }
      if (open) {
        closeSubmenu()
      } else {
        openSubmenu()
      }
    },
    [disabled, open, openSubmenu, closeSubmenu],
  )

  // Handle keyboard
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return

      const direction = store.state.direction

      // Enter or Space opens submenu
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        openSubmenu()
        return
      }

      // Arrow right (ltr) or Arrow left (rtl) opens submenu
      if (
        (direction === 'ltr' && event.key === 'ArrowRight') ||
        (direction === 'rtl' && event.key === 'ArrowLeft')
      ) {
        event.preventDefault()
        openSubmenu()
        return
      }

      // Arrow left (ltr) or Arrow right (rtl) closes submenu when open
      if (
        open &&
        ((direction === 'ltr' && event.key === 'ArrowLeft') ||
          (direction === 'rtl' && event.key === 'ArrowRight'))
      ) {
        event.preventDefault()
        closeSubmenu()
        return
      }
    },
    [disabled, store.state.direction, open, openSubmenu, closeSubmenu],
  )

  // Handle pointer enter for highlighting
  const handlePointerEnter = React.useCallback(() => {
    if (!disabled) {
      store.setActiveId(surfaceId, triggerId)
      // Auto-open submenu on hover after a short delay
      // This is common UX for submenus
    }
  }, [store, surfaceId, triggerId, disabled])

  // Prevent pointerdown from stealing focus from the input
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
    },
    [],
  )

  // Handle pointer leave
  const handlePointerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Only close if moving outside of both trigger and submenu
      const relatedTarget = event.relatedTarget as HTMLElement | null
      if (relatedTarget && itemRef.current) {
        // Check if moving to submenu content
        const submenuElement = document.querySelector(
          `[data-surface-id="${submenuId}"]`,
        )
        if (submenuElement?.contains(relatedTarget)) {
          return // Don't close when moving to submenu
        }
      }
    },
    [submenuId],
  )

  const state: MenuSubmenuTrigger.State = React.useMemo(
    () => ({
      highlighted,
      disabled,
      open,
    }),
    [highlighted, disabled, open],
  )

  const resolvedClassName =
    typeof className === 'function' ? className(state) : className

  const element = useRender<MenuSubmenuTriggerState, HTMLDivElement>({
    render: render as useRender.RenderProp<MenuSubmenuTriggerState> | undefined,
    state,
    props: {
      ...otherProps,
      className: resolvedClassName,
      id: triggerId,
      role: 'menuitem',
      tabIndex: -1,
      'aria-haspopup': 'menu',
      'aria-expanded': open,
      'aria-controls': open ? submenuId : undefined,
      'aria-disabled': disabled || undefined,
      'data-highlighted': highlighted ? '' : undefined,
      'data-disabled': disabled ? '' : undefined,
      'data-open': open ? '' : undefined,
      'data-closed': !open ? '' : undefined,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      onPointerDown: handlePointerDown,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
      children,
    },
    ref: (node: HTMLDivElement | null) => {
      itemRef.current = node
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
    },
    defaultTagName: 'div',
  })

  return element
})

MenuSubmenuTrigger.displayName = 'MenuSubmenuTrigger'
