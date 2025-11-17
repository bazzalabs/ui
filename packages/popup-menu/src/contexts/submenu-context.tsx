import type { SubmenuDef } from '@bazza-ui/menu'
import * as React from 'react'
import type { ActivationCause } from '../types.js'

/** Submenu context (open state/refs/ids). */
export type SubContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenToggle: () => void
  triggerRef: React.RefObject<HTMLDivElement | HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  def: SubmenuDef
  parentSurfaceId: string
  triggerItemId: string | null
  setTriggerItemId: (id: string | null) => void
  parentSetActiveId: (id: string | null, cause?: ActivationCause) => void
  childSurfaceId: string
  pendingOpenModalityRef: React.RefObject<'keyboard' | 'pointer' | null>
  intentZoneActiveRef: React.RefObject<boolean>
  parentSub: SubContextValue | null
}

const SubCtx = React.createContext<SubContextValue | null>(null)

export const useSub = () => React.useContext(SubCtx)

export function closeSubmenuChain(sub: SubContextValue | null) {
  let current = sub
  while (current) {
    current.onOpenChange(false)
    current = current.parentSub
  }
}

export { SubCtx }
