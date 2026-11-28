'use client'

import { isScopeSettled } from '@bazza-ui/menu-core'
import * as React from 'react'
import { useMaybeStore } from '../hooks/use-maybe-store.js'
import { type MenuTreeState, selectLoaders } from '../store/MenuTreeStore.js'
import { LoaderScopeContext } from './async-coordinator.js'
import type { LoaderState, NodeDef } from './types.js'

const IDLE: LoaderState<NodeDef[]> = { status: 'idle' }

interface LoaderKey {
  /** The data surface's loader scope. */
  readonly scope: string
  /** The branch's Resolved ID; `null` for the surface's own `asyncContent`. */
  readonly id: string | null
}

const selectLoaderState = (
  state: Pick<MenuTreeState, 'loaders'>,
  key: LoaderKey | undefined,
): LoaderState<NodeDef[]> => {
  if (!key) return IDLE
  const { loaders } = selectLoaders(state, key.scope)
  const entry = key.id === null ? loaders.root : loaders.branches.get(key.id)
  return entry?.state ?? IDLE
}

/**
 * Where a loader of the data-first Surface around the caller stands, as one
 * status tied to the query its results answer (`LoaderState`). With no
 * argument, the Surface's own `asyncContent` loader; with a branch's Resolved
 * ID (`node.id`), the branch loader that surface runs for deep search. A
 * submenu's or subpage's own loader is its own Surface's: call it from
 * inside that Surface with no argument.
 *
 * Re-renders only when that loader's state changes. `idle` outside a
 * data-first Surface, and for a loader that isn't running.
 */
export function useLoader(branchId: string | null = null): LoaderState {
  const handle = React.useContext(LoaderScopeContext)
  const key = React.useMemo<LoaderKey | undefined>(
    () => (handle ? { scope: handle.id, id: branchId } : undefined),
    [handle, branchId],
  )
  return useMaybeStore(handle?.tree, selectLoaderState, IDLE, key)
}

/**
 * Whether every loader of the tree has settled for `query`, from the tree's
 * state alone: it holds every scope's snapshot from the loader manager
 * (`LoaderManager.isTreeSettled`, over the same snapshots).
 */
const selectTreeSettled = (
  state: Pick<MenuTreeState, 'loaders'>,
  query: string,
): boolean => {
  for (const scopeId in state.loaders) {
    const scope = state.loaders[scopeId]
    if (scope && !isScopeSettled(scope.loaders, query)) return false
  }
  return true
}

/**
 * Whether every loader of the menu tree around the data-first Surface has
 * settled for `query` (`LoaderManager.isTreeSettled`): true outside one, and
 * while no loader has started. Re-renders only when that changes.
 */
export function useLoadersSettled(query: string): boolean {
  const tree = React.useContext(LoaderScopeContext)?.tree
  return useMaybeStore(tree, selectTreeSettled, true, query)
}
