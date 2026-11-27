'use client'

import { useStore } from '@base-ui/utils/store'
import { Pos } from '@bazza-ui/menu-core'
import * as React from 'react'
import { type ListboxStore, positionBits } from '../store/ListboxStore.js'

/** A row's edges among the mounted rows, from its `Pos` bitmask. */
export interface RowPosition {
  /** The first row outside any group. */
  first: boolean
  /** The last row outside any group. */
  last: boolean
  firstInGroup: boolean
  lastInGroup: boolean
  /** The first group row. */
  firstGroup: boolean
  /** The last group row. */
  lastGroup: boolean
}

/**
 * Subscribes to a row's positional bitmask (`positionBits`), one number, so
 * the row re-renders only when one of its edges changes. All false in a
 * virtualized list.
 */
export function useRowPosition(
  store: ListboxStore,
  rowId: string,
): RowPosition {
  const bits = useStore(store, positionBits, rowId)
  return React.useMemo(
    () => ({
      first: (bits & Pos.First) !== 0,
      last: (bits & Pos.Last) !== 0,
      firstInGroup: (bits & Pos.FirstInContainer) !== 0,
      lastInGroup: (bits & Pos.LastInContainer) !== 0,
      firstGroup: (bits & Pos.FirstContainer) !== 0,
      lastGroup: (bits & Pos.LastContainer) !== 0,
    }),
    [bits],
  )
}
