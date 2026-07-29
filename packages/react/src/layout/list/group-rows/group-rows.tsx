'use client'

import type * as React from 'react'
import { useListGroupContext } from '../contexts/group-context.js'
import { useListContext } from '../contexts/list-context.js'

export interface ListGroupRowsProps {
  children?: React.ReactNode
}

export function ListGroupRows({ children }: ListGroupRowsProps) {
  const { store } = useListContext()
  const { value } = useListGroupContext()
  const collapsed = store.collapseStore.useState('collapsedGroups').has(value)
  return collapsed ? null : children
}

export namespace ListGroupRows {
  export interface Props extends ListGroupRowsProps {}
}
