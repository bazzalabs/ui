'use client'

import * as React from 'react'
import { useMaybeFocusZoneRegistry } from '../../contexts/focus-zone-context.js'
import { useMenuEnclosingSurface } from '../../contexts/surface-tier-context.js'

/** Registers an element as a focus zone for the surface it renders in. */
export function useFocusZoneRegistration(element: HTMLElement | null): void {
  const { surfaceId } = useMenuEnclosingSurface()
  const registry = useMaybeFocusZoneRegistry()
  const zoneId = React.useId()

  React.useLayoutEffect(() => {
    if (!registry || !element) return undefined
    return registry.registerZone(surfaceId, zoneId, element)
  }, [registry, surfaceId, zoneId, element])
}
