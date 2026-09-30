'use client'

import * as React from 'react'
import { usePopupMenuDebug } from '../contexts/popup-menu-debug-context.js'
import { AimGuardStore } from '../store/AimGuardStore.js'

export const AimGuardContext = React.createContext<AimGuardStore | null>(null)
const fallbackAimGuardStore = new AimGuardStore()

export const useAimGuard = (): AimGuardStore =>
  React.useContext(AimGuardContext) ?? fallbackAimGuardStore

export interface AimGuardProviderProps {
  children: React.ReactNode
}

/**
 * Provides the short-lived shield that stops sibling rows from taking highlight
 * while the pointer is aiming at an open submenu.
 */
export function AimGuardProvider({ children }: AimGuardProviderProps) {
  const { logAimGuardEvents } = usePopupMenuDebug()
  const logEnabledRef = React.useRef(logAimGuardEvents)
  logEnabledRef.current = logAimGuardEvents
  const storeRef = React.useRef<AimGuardStore | null>(null)
  if (storeRef.current === null) {
    storeRef.current = new AimGuardStore({
      log: (event, details) => {
        if (!logEnabledRef.current) return
        console.log(`[PopupMenu][AimGuardProvider] ${event}`, details)
      },
    })
  }
  const store = storeRef.current

  React.useEffect(() => () => store.dispose(), [store])

  return (
    <AimGuardContext.Provider value={store}>
      {children}
    </AimGuardContext.Provider>
  )
}
