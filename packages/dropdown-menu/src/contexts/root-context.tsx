import type { InteractionGuardOptions } from '@bazza-ui/popup-menu'
import * as React from 'react'
import type { DropdownMenuControl } from '../control.js'

export type RootContextValue<T = unknown> = {
  scopeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  closeAllSurfaces: () => void
  triggerRef: React.RefObject<HTMLElement | null>
  control: DropdownMenuControl<T>
  interactionGuardOptions: Partial<InteractionGuardOptions>
}

const RootContext = React.createContext<RootContextValue<any> | null>(null)

export function RootContextProvider<T = unknown>({
  children,
  value,
}: {
  children: React.ReactNode
  value: RootContextValue<T>
}) {
  return <RootContext.Provider value={value}>{children}</RootContext.Provider>
}

export function useRootContext<T = unknown>(): RootContextValue<T> {
  const ctx = React.useContext(RootContext)
  if (!ctx) {
    throw new Error('useRootContext must be used within RootContextProvider')
  }
  return ctx as RootContextValue<T>
}
