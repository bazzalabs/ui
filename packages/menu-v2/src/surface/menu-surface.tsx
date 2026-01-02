'use client'

import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
import { useMenuRootContext } from '../root/menu-root-context.js'
import {
  MenuSurfaceContext,
  useOptionalMenuSurfaceContext,
  type MenuSurfaceContextValue,
} from './menu-surface-context.js'
import { useOptionalMenuSubmenuContext } from '../submenu/menu-submenu-context.js'
import { ROOT_SURFACE_ID } from '../store/index.js'

/**
 * State for the MenuSurface component
 */
export interface MenuSurfaceState extends Record<string, unknown> {
  /** Whether this surface is open */
  open: boolean
  /** Depth in the menu hierarchy */
  depth: number
  /** Whether this is a submenu surface */
  submenu: boolean
}

/**
 * Props for the MenuSurface component
 */
export interface MenuSurfaceProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'className'> {
  /**
   * The content of the surface.
   */
  children?: React.ReactNode
  /**
   * A function to customize the rendered element.
   */
  render?:
    | React.ReactElement
    | ((
        props: React.HTMLAttributes<HTMLDivElement>,
        state: MenuSurfaceState,
      ) => React.ReactElement)
  /**
   * Class name or function that returns a class name based on state.
   */
  className?: string | ((state: MenuSurfaceState) => string)
}

export namespace MenuSurface {
  export type State = MenuSurfaceState
  export type Props = MenuSurfaceProps
}

/**
 * Container for all parts of a menu level (root or submenu).
 * Provides surface context for items within.
 *
 * When used inside a MenuSubmenu, it automatically becomes a submenu surface
 * and uses the submenu's open state and IDs.
 *
 * Renders a `<div>` element.
 */
export const MenuSurface = React.forwardRef<HTMLDivElement, MenuSurface.Props>(
  function MenuSurface(props, forwardedRef) {
    const { children, render, className, ...otherProps } = props

    const { store } = useMenuRootContext()
    const parentSurface = useOptionalMenuSurfaceContext()
    const submenuContext = useOptionalMenuSubmenuContext()

    // Determine if this is a submenu surface
    const isSubmenu = submenuContext !== null
    const isRoot = !parentSurface && !isSubmenu

    // Surface ID and depth depend on whether we're in a submenu
    const surfaceId = isSubmenu ? submenuContext.submenuId : ROOT_SURFACE_ID
    const depth = isSubmenu ? submenuContext.depth : 0
    const parentSurfaceId = isSubmenu ? submenuContext.parentSurfaceId : null
    const listId = `${surfaceId}-list`

    // Get open state - for submenu, use submenu context; for root, use store
    const rootOpen = store.useState('open')
    const open = isSubmenu ? submenuContext.open : rootOpen

    const state: MenuSurface.State = React.useMemo(
      () => ({
        open,
        depth,
        submenu: isSubmenu,
      }),
      [open, depth, isSubmenu],
    )

    const surfaceContext = React.useMemo<MenuSurfaceContextValue>(
      () => ({
        surfaceId,
        depth,
        parentSurfaceId,
        listId,
      }),
      [surfaceId, depth, parentSurfaceId, listId],
    )

    const resolvedClassName =
      typeof className === 'function' ? className(state) : className

    const element = useRender<MenuSurfaceState, HTMLDivElement>({
      render: render as useRender.RenderProp<MenuSurfaceState> | undefined,
      state,
      props: {
        ...otherProps,
        className: resolvedClassName,
        'data-open': open ? '' : undefined,
        'data-closed': !open ? '' : undefined,
        'data-surface-id': surfaceId,
        'data-depth': depth,
        'data-submenu': isSubmenu ? '' : undefined,
        children,
      },
      ref: forwardedRef,
      defaultTagName: 'div',
    })

    // For submenus, only render when open
    if (isSubmenu && !open) {
      return null
    }

    return (
      <MenuSurfaceContext.Provider value={surfaceContext}>
        {element}
      </MenuSurfaceContext.Provider>
    )
  },
)

MenuSurface.displayName = 'MenuSurface'
