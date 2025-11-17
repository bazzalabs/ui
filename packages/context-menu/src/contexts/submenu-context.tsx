import type { SubmenuNode } from '@bazza-ui/menu'
import * as React from 'react'

export type SubContextValue<T = unknown> = {
  node: SubmenuNode<T>
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef: React.RefObject<HTMLDivElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
}

const SubCtx = React.createContext<SubContextValue | null>(null)

export const useSubCtx = () => React.useContext(SubCtx)

export { SubCtx }
