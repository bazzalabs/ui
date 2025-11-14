import * as React from 'react'

/** Provides a stable id string for the current surface. */
const SurfaceIdCtx = React.createContext<string | null>(null)

export const useSurfaceId = () => React.useContext(SurfaceIdCtx)

export { SurfaceIdCtx }
