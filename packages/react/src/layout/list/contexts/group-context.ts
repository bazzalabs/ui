'use client'

import * as React from 'react'

export interface ListGroupContextValue {
  value: string
  collectionValue: string
  collapsed: boolean
}

const ListGroupContext = React.createContext<ListGroupContextValue | null>(null)

export function useListGroupContext(): ListGroupContextValue {
  const context = React.useContext(ListGroupContext)
  if (!context)
    throw new Error('List.Group components must be used within a List.Group')
  return context
}

export function useMaybeListGroupContext(): ListGroupContextValue | null {
  return React.useContext(ListGroupContext)
}

export { ListGroupContext }
