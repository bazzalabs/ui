import type { InteractionGuardOptions } from '@bazza-ui/popup-menu'
import * as React from 'react'

export type RootContextValue = {
  scopeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  closeAllSurfaces: () => void
  triggerRef: React.RefObject<HTMLElement | null>
  interactionGuardOptions: Partial<InteractionGuardOptions>
}

const RootContext = React.createContext<RootContextValue | null>(null)

export function RootContextProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: RootContextValue
}) {
  return <RootContext.Provider value={value}>{children}</RootContext.Provider>
}

export function useRootContext(): RootContextValue {
  const ctx = React.useContext(RootContext)
  if (!ctx) {
    throw new Error('useRootContext must be used within RootContextProvider')
  }
  return ctx
}
