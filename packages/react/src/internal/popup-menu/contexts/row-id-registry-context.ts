import * as React from 'react'
import type { RowIdRegistry } from '../deep-search/row-id-registry.js'

const RowIdRegistryContext = React.createContext<RowIdRegistry | null>(null)

export function useRowIdRegistry(): RowIdRegistry | null {
  const context = React.useContext(RowIdRegistryContext)
  return process.env.NODE_ENV === 'production' ? null : context
}

export { RowIdRegistryContext }
