'use client'

import * as React from 'react'
import { Popover } from '@base-ui/react/popover'
import { Menu } from '@bazza-ui/menu-v2'

/**
 * State for the DropdownMenuSurface component
 */
export interface DropdownMenuSurfaceState {
  /** Whether the menu is open */
  open: boolean
  /** Which side the menu is positioned on */
  side: 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'
  /** How the menu is aligned */
  align: 'start' | 'center' | 'end'
  /** Depth in the menu hierarchy */
  depth: number
  /** Whether this is a submenu surface */
  submenu: boolean
}

/**
 * Props for the DropdownMenuSurface component
 */
export interface DropdownMenuSurfaceProps
  extends Omit<Popover.Popup.Props, 'className' | 'style'> {
  /**
   * Class name or function that returns a class name based on state.
   */
  className?: string | ((state: DropdownMenuSurfaceState) => string)
  /**
   * Style or function that returns a style object based on state.
   */
  style?:
    | React.CSSProperties
    | ((state: DropdownMenuSurfaceState) => React.CSSProperties)
}

export namespace DropdownMenuSurface {
  export type Props = DropdownMenuSurfaceProps
  export type State = DropdownMenuSurfaceState
}

/**
 * A container for the dropdown menu contents.
 * Composes Popover.Popup for positioning behavior and Menu.Surface for menu context.
 *
 * Renders a `<div>` element.
 */
export const DropdownMenuSurface = React.forwardRef<
  HTMLDivElement,
  DropdownMenuSurface.Props
>(function DropdownMenuSurface(props, ref) {
  const { children, className, style, ...popupProps } = props

  // For className/style functions, we need to merge states from both Popover and Menu
  // We use Popover.Popup's render prop to access its state
  return (
    <Popover.Popup
      ref={ref}
      {...popupProps}
      render={(popoverProps, popoverState) => {
        // Create merged state for className/style functions
        const mergedState: DropdownMenuSurfaceState = {
          open: popoverState.open,
          side: popoverState.side,
          align: popoverState.align,
          // Menu.Surface will provide these via its own context
          // For now, default values - they'll be updated by Menu.Surface
          depth: 0,
          submenu: false,
        }

        const resolvedClassName =
          typeof className === 'function' ? className(mergedState) : className
        const resolvedStyle =
          typeof style === 'function' ? style(mergedState) : style

        return (
          <div
            {...popoverProps}
            className={resolvedClassName}
            style={{ ...popoverProps.style, ...resolvedStyle }}
          >
            <Menu.Surface>{children}</Menu.Surface>
          </div>
        )
      }}
    />
  )
})

DropdownMenuSurface.displayName = 'DropdownMenuSurface'
