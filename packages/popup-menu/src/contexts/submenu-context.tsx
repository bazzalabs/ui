import * as React from 'react'
import type { ActivationCause, PopupSubmenuDef } from '../types.js'

/** Submenu context (open state/refs/ids). */
export type SubContextValue<T = unknown> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenToggle: () => void
  triggerRef: React.RefObject<HTMLDivElement | HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  def: PopupSubmenuDef<T>
  parentSurfaceId: string
  triggerItemId: string | null
  setTriggerItemId: (id: string | null) => void
  parentSetActiveId: (id: string | null, cause?: ActivationCause) => void
  childSurfaceId: string
  pendingOpenModalityRef: React.RefObject<'keyboard' | 'pointer' | null>
  intentZoneActiveRef: React.RefObject<boolean>
  parentSub: SubContextValue | undefined
}

const SubCtx = React.createContext<SubContextValue<any> | null>(null)

export function useSub<T = unknown>() {
  const ctx = React.useContext(SubCtx)

  if (!ctx) {
    return undefined
  }

  return ctx as SubContextValue<T>
}

export function closeSubmenuChain(sub: SubContextValue | undefined) {
  let current = sub
  while (current) {
    current.onOpenChange(false)
    current = current.parentSub
  }
}

export { SubCtx }
