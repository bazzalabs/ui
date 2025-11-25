import * as React from 'react'
import { ListRenderer } from './list-renderer.js'

export interface CommandMenuListProps {
  query?: string
  onQueryChange?: (query: string) => void
}

/**
 * CommandMenuList - Simple wrapper around ListRenderer
 * All orchestration (store, loader, menu building) now happens in CommandMenuContent
 */
export function CommandMenuList({
  query,
  onQueryChange,
}: CommandMenuListProps) {
  return <ListRenderer query={query} onQueryChange={onQueryChange} />
}
