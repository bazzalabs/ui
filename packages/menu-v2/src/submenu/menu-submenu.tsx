'use client'

import * as React from 'react'
import { useMenuRootContext } from '../root/menu-root-context.js'
import { useMenuSurfaceContext } from '../surface/menu-surface-context.js'
import {
  MenuSubmenuContext,
  type MenuSubmenuContextValue,
} from './menu-submenu-context.js'

/**
 * Props for the MenuSubmenu component
 */
export interface MenuSubmenuProps {
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

export namespace MenuSubmenu {
  export type Props = MenuSubmenuProps
}

/**
 * A submenu container that manages submenu state and context.
 * Should contain a SubmenuTrigger and a Surface with menu items.
 *
 * This component doesn't render any DOM element itself - it only provides context.
 *
 * @example
 * ```tsx
 * <Menu.Submenu>
 *   <Menu.SubmenuTrigger>More options</Menu.SubmenuTrigger>
 *   <Menu.Surface>
 *     <Menu.List>
 *       <Menu.Item>Option 1</Menu.Item>
 *       <Menu.Item>Option 2</Menu.Item>
 *     </Menu.List>
 *   </Menu.Surface>
 * </Menu.Submenu>
 * ```
 */
export function MenuSubmenu(props: MenuSubmenu.Props) {
  const { children, open: openProp, defaultOpen = false, onOpenChange } = props

  const { store, menuId } = useMenuRootContext()
  const parentSurface = useMenuSurfaceContext()

  // Generate stable IDs
  const generatedId = React.useId()
  const submenuId = `${menuId}-submenu-${generatedId}`
  const triggerId = `${submenuId}-trigger`

  // Track depth
  const depth = parentSurface.depth + 1

  // Handle controlled/uncontrolled open state
  const [openState, setOpenState] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : openState

  // Register surface on mount
  React.useEffect(() => {
    store.registerSurface({
      id: submenuId,
      parentId: parentSurface.surfaceId,
      open,
      activeId: null,
      depth,
    })
    return () => {
      store.unregisterSurface(submenuId)
    }
  }, [store, submenuId, parentSurface.surfaceId, depth, open])

  // Sync open state with store when it changes
  React.useEffect(() => {
    const surface = store.state.surfaces.get(submenuId)
    if (surface && surface.open !== open) {
      if (open) {
        store.openSurface(submenuId)
      } else {
        store.closeSurface(submenuId)
      }
    }
  }, [store, submenuId, open])

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setOpenState(newOpen)
      }
      onOpenChange?.(newOpen)

      // Update store
      if (newOpen) {
        store.openSurface(submenuId)
      } else {
        store.closeSurface(submenuId)
      }
    },
    [isControlled, onOpenChange, store, submenuId],
  )

  const contextValue = React.useMemo<MenuSubmenuContextValue>(
    () => ({
      submenuId,
      triggerId,
      open,
      setOpen,
      depth,
      parentSurfaceId: parentSurface.surfaceId,
    }),
    [submenuId, triggerId, open, setOpen, depth, parentSurface.surfaceId],
  )

  return (
    <MenuSubmenuContext.Provider value={contextValue}>
      {children}
    </MenuSubmenuContext.Provider>
  )
}

MenuSubmenu.displayName = 'MenuSubmenu'
