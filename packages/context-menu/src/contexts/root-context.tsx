import * as React from 'react'
import type { ContextMenuRootContextValue } from '../types.js'

const RootCtx = React.createContext<ContextMenuRootContextValue | null>(null)

export const useRootCtx = () => {
  const ctx = React.useContext(RootCtx)
  if (!ctx) throw new Error('useRootCtx must be used within a ContextMenu')
  return ctx
}

export { RootCtx }
