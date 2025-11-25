import type {
  Menu,
  MenuClassNames,
  MenuControl,
  MenuSlotProps,
  MenuSlots,
  SurfaceStore,
} from '@bazza-ui/menu'
import * as React from 'react'
import type { CommandSubmenuDef } from '../types.js'

interface SurfaceContextValue<T = unknown> {
  store: SurfaceStore<T>
  menu: Menu<T>
  control?: MenuControl<T>
  slots?: Partial<MenuSlots<T>>
  classNames?: Partial<MenuClassNames>
  slotProps?: Partial<MenuSlotProps>
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
  store,
  menu,
  control,
  slots,
  classNames,
  slotProps,
  onSubmenuSelect,
  children,
}: {
  store: SurfaceStore<T>
  menu: Menu<T>
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
        store,
        menu,
        control,
        slots,
        classNames,
        slotProps,
        onSubmenuSelect,
      }) as SurfaceContextValue<T>,
    [store, menu, control, slots, classNames, slotProps, onSubmenuSelect],
  )

  return (
    <SurfaceContext.Provider value={value as any}>
      {children}
    </SurfaceContext.Provider>
  )
}
