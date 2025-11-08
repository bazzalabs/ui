import * as React from 'react'
import type { RootContextValue } from '../types.js'

const RootCtx = React.createContext<RootContextValue | null>(null)

export const useRootCtx = () => {
  const ctx = React.useContext(RootCtx)
  if (!ctx) throw new Error('useActionMenu must be used within an ActionMenu')
  return ctx
}

export { RootCtx }
