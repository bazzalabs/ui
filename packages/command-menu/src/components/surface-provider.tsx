import type {
  MenuClassNames,
  MenuControl,
  MenuSlotProps,
  MenuSlots,
} from '@bazza-ui/menu'
import * as React from 'react'
import type { CommandSubmenuDef } from '../types.js'

/**
 * Slimmed down surface context.
 * Most state is now in the global CommandMenuStore - use hooks like
 * useActiveId, useDisplayNodes, useSurfaceMenu, etc. to access it.
 *
 * Primitives (MenuInputPrimitive, MenuListPrimitive, MenuItemPrimitive) now
 * accept surfaceId + globalStore directly, so we no longer need to pass a
 * compat store through context.
 */
interface SurfaceContextValue<T = unknown> {
  // Identity
  surfaceId: string

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
  control,
  slots,
  classNames,
  slotProps,
  onSubmenuSelect,
  children,
}: {
  surfaceId: string
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
        control,
        slots,
        classNames,
        slotProps,
        onSubmenuSelect,
      }) as SurfaceContextValue<T>,
    [surfaceId, control, slots, classNames, slotProps, onSubmenuSelect],
  )

  return (
    <SurfaceContext.Provider value={value as any}>
      {children}
    </SurfaceContext.Provider>
  )
}
