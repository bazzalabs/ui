import type { MenuControl } from '@bazza-ui/menu'
import * as React from 'react'
import type {
  PopupMenuClassNames,
  PopupMenuSlotProps,
  PopupMenuSlots,
} from '../../types.js'

/**
 * Slimmed down surface context.
 * Most state is now in the global PopupMenuStore - use hooks like
 * useActiveId, useDisplayNodes, useSurfaceMenu, etc. to access it.
 */
export interface SurfaceContextValue<T = unknown> {
  // Identity
  surfaceId: string
  isSubmenu: boolean

  // External imperative control (optional)
  control?: MenuControl<T>

  // Theming (can't be in global store - varies per consumer)
  slots?: PopupMenuSlots<T>
  classNames?: PopupMenuClassNames
  slotProps?: PopupMenuSlotProps

  // Local refs (not in global store)
  contentRef?: React.RefObject<HTMLDivElement | null>

  // Callbacks (per-render, can't be in store)
  popupProps?: React.HTMLAttributes<HTMLElement>
  handleMouseMove: (e: React.MouseEvent) => void
  onClose?: () => void
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
