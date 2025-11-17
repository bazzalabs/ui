import type { Menu, SurfaceStore } from '@bazza-ui/menu'
import * as React from 'react'
import type { PopupMenuSlots, PopupMenuClassNames } from '../types.js'

export interface SurfaceContextValue<T = unknown> {
  store: SurfaceStore<T>
  menu: Menu<T>
  slots?: PopupMenuSlots<T>
  classNames?: PopupMenuClassNames
  onSubmenuSelect?: (submenuId: string, submenu: any) => void
}

const SurfaceContext = React.createContext<SurfaceContextValue<any> | null>(
  null,
)

export function SurfaceProvider<T = unknown>({
  children,
  ...value
}: SurfaceContextValue<T> & { children: React.ReactNode }) {
  return (
    <SurfaceContext.Provider value={value}>{children}</SurfaceContext.Provider>
  )
}

export function useSurface<T = unknown>(): SurfaceContextValue<T> {
  const ctx = React.useContext(SurfaceContext)
  if (!ctx) {
    throw new Error('useSurface must be used within a SurfaceProvider')
  }
  return ctx
}
