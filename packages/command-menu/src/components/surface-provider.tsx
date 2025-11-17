import type {
  Menu,
  MenuClassNames,
  MenuDef,
  MenuSlotProps,
  MenuSlots,
  SurfaceStore,
} from '@bazza-ui/menu'
import * as React from 'react'

interface SurfaceContextValue<T = unknown> {
  store: SurfaceStore<T>
  menu: Menu<T>
  slots?: Partial<MenuSlots<T>>
  classNames?: Partial<MenuClassNames>
  slotProps?: Partial<MenuSlotProps>
  onSubmenuSelect?: (submenuId: string, submenu: MenuDef<any>) => void
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
  slots,
  classNames,
  slotProps,
  onSubmenuSelect,
  children,
}: {
  store: SurfaceStore<T>
  menu: Menu<T>
  slots?: Partial<MenuSlots<T>>
  classNames?: Partial<MenuClassNames>
  slotProps?: Partial<MenuSlotProps>
  onSubmenuSelect?: (submenuId: string, submenu: MenuDef<any>) => void
  children: React.ReactNode
}) {
  const value = React.useMemo(
    () =>
      ({
        store,
        menu,
        slots,
        classNames,
        slotProps,
        onSubmenuSelect,
      }) as SurfaceContextValue<T>,
    [store, menu, slots, classNames, slotProps, onSubmenuSelect],
  )

  return (
    <SurfaceContext.Provider value={value as any}>
      {children}
    </SurfaceContext.Provider>
  )
}
