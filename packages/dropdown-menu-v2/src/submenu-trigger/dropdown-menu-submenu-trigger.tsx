'use client'

import * as React from 'react'
import { Popover } from '@base-ui/react/popover'
import { Menu, type MenuSubmenuTriggerProps } from '@bazza-ui/menu-v2'

/**
 * Props for the DropdownMenuSubmenuTrigger component
 */
export interface DropdownMenuSubmenuTriggerProps
  extends Omit<MenuSubmenuTriggerProps, 'render'> {}

export namespace DropdownMenuSubmenuTrigger {
  export type Props = DropdownMenuSubmenuTriggerProps
}

/**
 * A menu item that opens a submenu when activated.
 * Composes Popover.Trigger for anchor positioning and Menu.SubmenuTrigger for menu behavior.
 *
 * Renders a `<div>` element with `role="menuitem"` and `aria-haspopup="menu"`.
 */
export const DropdownMenuSubmenuTrigger = React.forwardRef<
  HTMLDivElement,
  DropdownMenuSubmenuTrigger.Props
>(function DropdownMenuSubmenuTrigger(props, ref) {
  const { children, ...otherProps } = props

  // Use Popover.Trigger's render prop to compose with Menu.SubmenuTrigger
  // This allows Popover to use Menu.SubmenuTrigger as the positioning anchor
  return (
    <Popover.Trigger
      render={(triggerProps) => (
        <Menu.SubmenuTrigger ref={ref} {...otherProps} {...triggerProps}>
          {children}
        </Menu.SubmenuTrigger>
      )}
    />
  )
})

DropdownMenuSubmenuTrigger.displayName = 'DropdownMenuSubmenuTrigger'
