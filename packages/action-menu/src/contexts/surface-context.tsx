import * as React from 'react'
import type { SurfaceStore } from '../types.js'

const SurfaceCtx = React.createContext<SurfaceStore<any> | null>(null)

export const useSurface = () => {
  const ctx = React.useContext(SurfaceCtx)
  if (!ctx) throw new Error('SurfaceCtx missing')
  return ctx
}

export { SurfaceCtx }
