'use client'

import * as React from 'react'
import type { FocusZoneStore } from '../store/FocusZoneStore.js'

// ============================================================================
// Focus Zones Context
// ============================================================================

const FocusZonesContext = React.createContext<FocusZoneStore | null>(null)

export function useFocusZones(): FocusZoneStore {
  const context = React.useContext(FocusZonesContext)
  if (!context) {
    throw new Error(
      'FocusZone components must be used within a FocusZonesProvider',
    )
  }
  return context
}

export function useMaybeFocusZones(): FocusZoneStore | null {
  return React.useContext(FocusZonesContext)
}

export { FocusZonesContext }
