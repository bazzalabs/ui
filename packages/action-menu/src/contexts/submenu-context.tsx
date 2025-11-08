import * as React from 'react'
import type { RootContextValue, SubContextValue } from '../types.js'

/** Submenu context (open state/refs/ids). */
const SubCtx = React.createContext<SubContextValue | null>(null)

export const useSubCtx = () => React.useContext(SubCtx)

export function closeSubmenuChain(
  sub: SubContextValue | null,
  root: RootContextValue,
) {
  let current = sub
  while (current) {
    current.onOpenChange(false)
    current = current.parentSub
  }
  root.onOpenChange(false)
}

export { SubCtx }
