'use client'

import * as React from 'react'
import { useSurfaceContext } from '../../../listbox/index.js'
import { useMaybeFocusZoneRegistry } from '../../contexts/focus-zone-context.js'

/** Registers an element as a focus zone for the surface it renders in. */
export function useFocusZoneRegistration(element: HTMLElement | null): void {
  const { surfaceId } = useSurfaceContext()
  const registry = useMaybeFocusZoneRegistry()
  const zoneId = React.useId()

  React.useLayoutEffect(() => {
    if (!registry || !element) return undefined
    return registry.registerZone(surfaceId, zoneId, element)
  }, [registry, surfaceId, zoneId, element])
}
