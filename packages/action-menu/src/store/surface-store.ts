import type { Virtualizer } from '@tanstack/react-virtual'
import * as React from 'react'
import type {
  ActivationCause,
  Node,
  RowRecord,
  SurfaceState,
  SurfaceStore,
} from '../types.js'

export function createSurfaceStore<T>(): SurfaceStore<T> {
  const state: SurfaceState = { activeId: null, hasInput: true, listId: null }
  const listeners = new Set<() => void>()
  const rows = new Map<string, RowRecord>()
  const rowIdToVirtualIndex = new Map<string, number>()
  const nodes: Node<T>[] = []
  const order: string[] = []
  const listRef = React.createRef<HTMLDivElement | null>()
  const inputRef = React.createRef<HTMLInputElement | null>()
  const virtualizerRef = React.createRef<Virtualizer<
    HTMLDivElement,
    Element
  > | null>()

  const emit = () =>
    listeners.forEach((l) => {
      l()
    })
  const snapshot = () => state
  const set = <K extends keyof SurfaceState>(k: K, v: SurfaceState[K]) => {
    if (Object.is((state as any)[k], v)) return
    ;(state as any)[k] = v
    emit()
  }

  function getNodes() {
    return nodes
  }

  const setNodes = (all: Node<T>[]) => {
    nodes.splice(0)
    nodes.push(...all)
  }

  const getOrder = () => order.slice()
  const resetOrder = (ids: string[]) => {
    order.splice(0)
    order.push(...ids)
    emit()
  }

  const resetVirtualIndexMap = (map: Map<string, number>) => {
    rowIdToVirtualIndex.clear()
    for (const [id, virtualIndex] of map) {
      rowIdToVirtualIndex.set(id, virtualIndex)
    }
  }

  const setActiveId = (
    id: string | null,
    cause: ActivationCause = 'keyboard',
  ) => {
    const prev = state.activeId
    if (Object.is(prev, id)) return

    // Close any open submenu that is not the active trigger BEFORE updating activeId
    // This ensures controlled submenus have a chance to close before we activate a new one
    for (const [rid, rec] of rows) {
      if (rec.kind === 'submenu' && rec.closeSub && rid !== id) {
        try {
          rec.closeSub()
        } catch {}
      }
    }

    state.activeId = id
    emit()
    // Scroll active row into view when keyboard navigating
    if (cause !== 'keyboard') return
    if (id === null) return

    const row = rows.get(id)
    const index = order.indexOf(id)
    const el = row?.ref.current
    const listEl = listRef.current
    if (el && listEl) {
      try {
        const inList = listEl.contains(el)
        if (inList) el.scrollIntoView({ block: 'nearest' })
      } catch {}
      return
    }

    // Use virtual index for scrolling (accounts for separators, headings, etc.)
    const virtualIndex = rowIdToVirtualIndex.get(id)
    if (
      virtualIndex !== undefined &&
      (index === 0 || index === order.length - 1)
    ) {
      virtualizerRef.current?.scrollToIndex(virtualIndex)
    }
  }

  const setActiveByIndex = (
    idx: number,
    cause: ActivationCause = 'keyboard',
  ) => {
    if (!order.length) return setActiveId(null, cause)
    const clamped = idx < 0 ? 0 : idx >= order.length ? order.length - 1 : idx
    setActiveId(order[clamped]!, cause)
  }

  const first = (cause: ActivationCause = 'keyboard') => {
    if (!order.length) return

    const id = order[0]
    if (!id) return

    setActiveId(id, cause)
  }

  const last = (cause: ActivationCause = 'keyboard') => {
    if (!order.length) return

    const id = order[order.length - 1]
    if (!id) return

    setActiveId(id, cause)
  }
  const next = (cause: ActivationCause = 'keyboard') => {
    if (!order.length) return
    const index = state.activeId ? order.indexOf(state.activeId) : -1
    const nextIndex = index + 1 < order.length ? index + 1 : 0

    const nextId = order[nextIndex]
    if (!nextId) return

    setActiveId(nextId, cause)
  }
  const prev = (cause: ActivationCause = 'keyboard') => {
    if (!order.length) return
    const index = state.activeId
      ? order.indexOf(state.activeId)
      : order.length - 1
    const nextIndex = index > 0 ? index - 1 : order.length - 1

    const nextId = order[nextIndex]

    if (!nextId) return

    setActiveId(nextId, cause)
  }

  return {
    subscribe(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    snapshot,
    set,
    getNodes,
    setNodes,
    registerRow(id, rec) {
      rows.set(id, rec)
      emit()
    },
    unregisterRow(id) {
      rows.delete(id)
      emit()
    },
    getOrder,
    resetOrder,
    resetVirtualIndexMap,
    setActiveId,
    setActiveByIndex,
    first,
    last,
    next,
    prev,
    rows,
    rowIdToVirtualIndex,
    inputRef,
    listRef,
    virtualizerRef,
  }
}
