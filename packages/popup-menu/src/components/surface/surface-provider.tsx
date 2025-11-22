import type { Menu, Node, SurfaceStore } from '@bazza-ui/menu'
import * as React from 'react'
import type {
  PopupMenuClassNames,
  PopupMenuSlotProps,
  PopupMenuSlots,
} from '../../types.js'

export interface SurfaceContextValue<T = unknown> {
  // Store
  store: SurfaceStore<T>

  // Orchestrated data (ready to consume)
  menu: Menu<T>
  displayNodes: Node<T>[]

  // Theming
  slots?: PopupMenuSlots<T>
  classNames?: PopupMenuClassNames
  slotProps?: PopupMenuSlotProps

  // State
  inputActive: boolean
  setInputActive: (active: boolean) => void
  query: string
  setQuery: (query: string) => void

  // Surface metadata and refs for Popup binding
  surfaceId: string
  isSubmenu: boolean
  contentRef?: React.RefObject<HTMLDivElement | null>
  popupProps?: React.HTMLAttributes<HTMLElement>
  handleMouseMove: (e: React.MouseEvent) => void
  onClose?: () => void

  // Handlers
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
