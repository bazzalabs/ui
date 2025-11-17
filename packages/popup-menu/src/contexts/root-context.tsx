import * as React from 'react'

export interface RootContextValue {
  /** Unique scope ID for this menu instance */
  scopeId: string
}

const RootContext = React.createContext<RootContextValue | null>(null)

export interface RootProviderProps {
  children: React.ReactNode
  scopeId: string
}

/**
 * Provider for root context. Provides the scope ID for the menu instance.
 */
export function RootProvider({ children, scopeId }: RootProviderProps) {
  const value = React.useMemo(() => ({ scopeId }), [scopeId])

  return <RootContext.Provider value={value}>{children}</RootContext.Provider>
}

/**
 * Hook to access root context.
 * Returns null if not within a RootProvider.
 */
export function useRoot(): RootContextValue | null {
  return React.useContext(RootContext)
}
