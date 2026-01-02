'use client'

import * as React from 'react'
import { Popover } from '@base-ui/react/popover'
import { Menu, useMenuSubmenuContext } from '@bazza-ui/menu-v2'

/**
 * Props for the DropdownMenuSubmenu component
 */
export interface DropdownMenuSubmenuProps {
  /**
   * The content of the submenu (should include SubmenuTrigger and Surface).
   */
  children?: React.ReactNode
  /**
   * Whether the submenu is open (controlled).
   */
  open?: boolean
  /**
   * The default open state (uncontrolled).
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Callback fired when the open state changes.
   */
  onOpenChange?: (open: boolean) => void
}

export namespace DropdownMenuSubmenu {
  export type Props = DropdownMenuSubmenuProps
}

/**
 * Inner component that has access to Menu.Submenu context
 */
function DropdownMenuSubmenuInner({ children }: { children: React.ReactNode }) {
  const submenuContext = useMenuSubmenuContext()

  return (
    <Popover.Root
      open={submenuContext.open}
      onOpenChange={submenuContext.setOpen}
    >
      {children}
    </Popover.Root>
  )
}

/**
 * A submenu container that manages submenu state and context.
 * Composes Popover.Root for positioning and Menu.Submenu for menu behavior.
 *
 * Should contain a SubmenuTrigger and the submenu content (Surface with items).
 *
 * @example
 * ```tsx
 * <DropdownMenu.Submenu>
 *   <DropdownMenu.SubmenuTrigger>More options</DropdownMenu.SubmenuTrigger>
 *   <DropdownMenu.Portal>
 *     <DropdownMenu.Positioner side="right">
 *       <DropdownMenu.Surface>
 *         <DropdownMenu.List>
 *           <DropdownMenu.Item>Option 1</DropdownMenu.Item>
 *         </DropdownMenu.List>
 *       </DropdownMenu.Surface>
 *     </DropdownMenu.Positioner>
 *   </DropdownMenu.Portal>
 * </DropdownMenu.Submenu>
 * ```
 */
export function DropdownMenuSubmenu(
  props: DropdownMenuSubmenu.Props,
): React.ReactNode {
  const { children, open, defaultOpen, onOpenChange } = props

  return (
    <Menu.Submenu
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <DropdownMenuSubmenuInner>{children}</DropdownMenuSubmenuInner>
    </Menu.Submenu>
  )
}

DropdownMenuSubmenu.displayName = 'DropdownMenuSubmenu'
