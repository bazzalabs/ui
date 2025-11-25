import type {
  Menu,
  MenuClassNames,
  MenuControl,
  MenuSlotProps,
  MenuSlots,
  Node,
} from '@bazza-ui/menu'
import * as React from 'react'
import type { CommandSubmenuDef } from '../types.js'

/**
 * Slimmed down surface context.
 *
 * Key state (menu, displayNodes) is passed directly through context to avoid
 * timing issues with store effects. Primitives (MenuInputPrimitive,
 * MenuListPrimitive, MenuItemPrimitive) still accept surfaceId + globalStore
 * for active ID tracking and other store-based features.
 */
interface SurfaceContextValue<T = unknown> {
  // Identity
  surfaceId: string

  // Menu state (passed directly to avoid effect timing issues)
  menu: Menu<T>
  displayNodes: Node<T>[]

  // External imperative control (optional)
  control?: MenuControl<T>

  // Theming (can't be in global store - varies per consumer)
  slots?: Partial<MenuSlots<T>>
  classNames?: Partial<MenuClassNames>
  slotProps?: Partial<MenuSlotProps>

  // Callbacks (per-render, can't be in store)
  onSubmenuSelect?: (submenuId: string, submenu: CommandSubmenuDef<any>) => void
}

const SurfaceContext = React.createContext<SurfaceContextValue<any> | null>(
  null,
)

export function useSurface<T = unknown>(): SurfaceContextValue<T> {
  const ctx = React.useContext(SurfaceContext) as SurfaceContextValue<T> | null
  if (!ctx) {
    throw new Error('useSurface must be used within a SurfaceProvider')
  }
  return ctx
}

export function SurfaceProvider<T = unknown>({
  surfaceId,
  menu,
  displayNodes,
  control,
  slots,
  classNames,
  slotProps,
  onSubmenuSelect,
  children,
}: {
  surfaceId: string
  menu: Menu<T>
  displayNodes: Node<T>[]
  control?: MenuControl<T>
  slots?: Partial<MenuSlots<T>>
  classNames?: Partial<MenuClassNames>
  slotProps?: Partial<MenuSlotProps>
  onSubmenuSelect?: (submenuId: string, submenu: CommandSubmenuDef<any>) => void
  children: React.ReactNode
}) {
  const value = React.useMemo(
    () =>
      ({
        surfaceId,
        menu,
        displayNodes,
        control,
        slots,
        classNames,
        slotProps,
        onSubmenuSelect,
      }) as SurfaceContextValue<T>,
    [
      surfaceId,
      menu,
      displayNodes,
      control,
      slots,
      classNames,
      slotProps,
      onSubmenuSelect,
    ],
  )

  return (
    <SurfaceContext.Provider value={value as any}>
      {children}
    </SurfaceContext.Provider>
  )
}
