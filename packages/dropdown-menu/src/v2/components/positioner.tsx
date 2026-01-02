import * as React from 'react'
import { Popover } from '@base-ui-components/react/popover'
import { useSubmenu } from '../contexts/submenu-context.js'

// ============================================================================
// Types
// ============================================================================

export interface PositionerProps
  extends React.ComponentPropsWithoutRef<typeof Popover.Positioner> {}

// ============================================================================
// Component
// ============================================================================

/**
 * Positions the menu content relative to the trigger.
 * Wraps Base UI's Popover.Positioner with smart defaults.
 *
 * - For root menus: defaults to `side="bottom"`
 * - For submenus: defaults to `side="right"`
 *
 * @example
 * ```tsx
 * // Root menu - defaults to bottom
 * <Menu.Positioner align="start" sideOffset={4}>
 *   <Menu.Surface>...</Menu.Surface>
 * </Menu.Positioner>
 *
 * // Submenu - defaults to right
 * <Menu.Submenu>
 *   <Menu.Submenu.Trigger>More</Menu.Submenu.Trigger>
 *   <Menu.Portal>
 *     <Menu.Positioner>
 *       <Menu.Surface>...</Menu.Surface>
 *     </Menu.Positioner>
 *   </Menu.Portal>
 * </Menu.Submenu>
 * ```
 */
export const MenuPositioner = React.forwardRef<HTMLDivElement, PositionerProps>(
  function MenuPositioner({ side, ...props }, forwardedRef) {
    const submenu = useSubmenu()

    // Default side based on context:
    // - Submenu: 'right' (opens to the side)
    // - Root menu: 'bottom' (opens below trigger)
    const defaultSide = submenu ? 'right' : 'bottom'
    const resolvedSide = side ?? defaultSide

    return (
      <Popover.Positioner ref={forwardedRef} side={resolvedSide} {...props} />
    )
  },
) as MenuPositioner

MenuPositioner.displayName = 'Menu.Positioner'

// ============================================================================
// Namespace
// ============================================================================

export interface MenuPositioner {
  (
    props: PositionerProps & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element
  displayName?: string
}

export namespace MenuPositioner {
  export type Props = PositionerProps
}
