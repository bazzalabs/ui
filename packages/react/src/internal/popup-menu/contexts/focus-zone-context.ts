'use client'

import * as React from 'react'
import type { FocusZoneRegistry } from '../store/FocusZoneRegistry.js'

const FocusZoneRegistryContext = React.createContext<FocusZoneRegistry | null>(
  null,
)

export function useMaybeFocusZoneRegistry(): FocusZoneRegistry | null {
  return React.useContext(FocusZoneRegistryContext)
}

export { FocusZoneRegistryContext }
