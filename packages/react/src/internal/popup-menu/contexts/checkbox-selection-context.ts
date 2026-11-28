'use client'

import * as React from 'react'
import { useMaybeSurfaceContext } from '../../listbox/contexts/surface-context.js'
import { useMaybeStore } from '../hooks/use-maybe-store.js'
import type {
  CheckboxSelectionState,
  CheckboxSelectionStore,
} from '../store/CheckboxSelectionStore.js'
import {
  type CheckboxSelectionSlot,
  findSurfaceTier,
  useMaybeMenuSurfaceTier,
} from './surface-tier-context.js'

const currentSelection = (state: { current: CheckboxSelectionStore | null }) =>
  state.current

const noop = () => {}

/**
 * The slot that holds the checkbox selection of the Surface around the
 * caller (its tier's `selection`), or null outside a Surface. Reading it
 * subscribes to nothing: read `slot.state.current` in a handler or an
 * effect.
 */
export function useCheckboxSelectionSlot(): CheckboxSelectionSlot | null {
  const surface = useMaybeSurfaceContext()
  return (
    findSurfaceTier(useMaybeMenuSurfaceTier(), surface?.store)?.selection ??
    null
  )
}

/**
 * The checkbox selection of the Surface around the caller: null outside a
 * Surface, and until the Surface's first checkbox row makes it. The caller
 * re-renders when it's made.
 */
export function useMaybeCheckboxSelection(): CheckboxSelectionStore | null {
  return useMaybeStore(useCheckboxSelectionSlot(), currentSelection, null)
}

/**
 * The kind of the selection's gesture under way, read through its slot:
 * undefined while there's no gesture or no selection. The caller re-renders
 * only when the kind changes, not when the selection is made.
 */
export function useCheckboxGestureKind(
  slot: CheckboxSelectionSlot | null,
): NonNullable<CheckboxSelectionState['gesture']>['kind'] | undefined {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      if (!slot) return noop
      let stopSelection = slot.state.current?.subscribe(onChange) ?? null
      const stopSlot = slot.subscribe(() => {
        stopSelection?.()
        stopSelection = slot.state.current?.subscribe(onChange) ?? null
        onChange()
      })
      return () => {
        stopSlot()
        stopSelection?.()
      }
    },
    [slot],
  )
  const getKind = () => slot?.state.current?.state.gesture?.kind
  return React.useSyncExternalStore(subscribe, getKind, getKind)
}
