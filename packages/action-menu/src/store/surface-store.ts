import type { Virtualizer } from '@tanstack/react-virtual'
import * as React from 'react'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  ActivationCause,
  Node,
  RowRecord,
  SurfaceState,
  SurfaceStore,
} from '../types.js'

type SurfaceStoreState<T> = {
  // State
  state: SurfaceState
  rows: Map<string, RowRecord>
  rowIdToVirtualIndex: Map<string, number>
  nodes: Node<T>[]
  order: string[]

  // Refs (not reactive)
  inputRef: React.RefObject<HTMLInputElement | null>
  listRef: React.RefObject<HTMLDivElement | null>
  virtualizerRef: React.RefObject<Virtualizer<HTMLDivElement, Element> | null>

  // Actions
  set: <K extends keyof SurfaceState>(k: K, v: SurfaceState[K]) => void
  getNodes: () => Node<T>[]
  setNodes: (nodes: Node<T>[]) => void
  registerRow: (id: string, rec: RowRecord) => void
  unregisterRow: (id: string) => void
  getOrder: () => string[]
  resetOrder: (ids: string[]) => void
  resetVirtualIndexMap: (map: Map<string, number>) => void
  setActiveId: (id: string | null, cause?: ActivationCause) => void
  setActiveByIndex: (idx: number, cause?: ActivationCause) => void
  first: (cause?: ActivationCause) => void
  last: (cause?: ActivationCause) => void
  next: (cause?: ActivationCause) => void
  prev: (cause?: ActivationCause) => void
}

export function createSurfaceStore<T>(): SurfaceStore<T> {
  // Create refs outside of Zustand store
  const inputRef = React.createRef<HTMLInputElement | null>()
  const listRef = React.createRef<HTMLDivElement | null>()
  const virtualizerRef = React.createRef<Virtualizer<
    HTMLDivElement,
    Element
  > | null>()

  // Create Zustand store
  const useStore = create<SurfaceStoreState<T>>()(
    subscribeWithSelector((set, get) => ({
      // Initial state
      state: { activeId: null, hasInput: true, listId: null },
      rows: new Map(),
      rowIdToVirtualIndex: new Map(),
      nodes: [],
      order: [],
      inputRef,
      listRef,
      virtualizerRef,

      // Actions
      set: <K extends keyof SurfaceState>(k: K, v: SurfaceState[K]) => {
        set((prev) => {
          if (Object.is(prev.state[k], v)) return prev
          return {
            state: { ...prev.state, [k]: v },
          }
        })
      },

      getNodes: () => get().nodes,

      setNodes: (newNodes: Node<T>[]) => {
        set({ nodes: newNodes })
      },

      registerRow: (id: string, rec: RowRecord) => {
        set((prev) => {
          const newRows = new Map(prev.rows)
          newRows.set(id, rec)
          return { rows: newRows }
        })
      },

      unregisterRow: (id: string) => {
        set((prev) => {
          const newRows = new Map(prev.rows)
          newRows.delete(id)
          return { rows: newRows }
        })
      },

      getOrder: () => get().order.slice(),

      resetOrder: (ids: string[]) => {
        set({ order: ids })
      },

      resetVirtualIndexMap: (map: Map<string, number>) => {
        const newMap = new Map(map)
        set({ rowIdToVirtualIndex: newMap })
      },

      setActiveId: (id: string | null, cause: ActivationCause = 'keyboard') => {
        const { state: currentState, rows, order } = get()
        const prev = currentState.activeId

        if (Object.is(prev, id)) return

        // Close any open submenu that is not the active trigger BEFORE updating activeId
        for (const [rid, rec] of rows) {
          if (rec.kind === 'submenu' && rec.closeSub && rid !== id) {
            try {
              rec.closeSub()
            } catch {}
          }
        }

        set((prev) => ({
          state: { ...prev.state, activeId: id },
        }))

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

        // Use virtual index for scrolling
        const { rowIdToVirtualIndex } = get()
        const virtualIndex = rowIdToVirtualIndex.get(id)
        if (
          virtualIndex !== undefined &&
          (index === 0 || index === order.length - 1)
        ) {
          virtualizerRef.current?.scrollToIndex(virtualIndex)
        }
      },

      setActiveByIndex: (idx: number, cause: ActivationCause = 'keyboard') => {
        const { order, setActiveId } = get()
        if (!order.length) return setActiveId(null, cause)
        const clamped =
          idx < 0 ? 0 : idx >= order.length ? order.length - 1 : idx
        setActiveId(order[clamped]!, cause)
      },

      first: (cause: ActivationCause = 'keyboard') => {
        const { order, setActiveId } = get()
        if (!order.length) return
        const id = order[0]
        if (!id) return
        setActiveId(id, cause)
      },

      last: (cause: ActivationCause = 'keyboard') => {
        const { order, setActiveId } = get()
        if (!order.length) return
        const id = order[order.length - 1]
        if (!id) return
        setActiveId(id, cause)
      },

      next: (cause: ActivationCause = 'keyboard') => {
        const { state: currentState, order, setActiveId } = get()
        if (!order.length) return
        const index = currentState.activeId
          ? order.indexOf(currentState.activeId)
          : -1
        const nextIndex = index + 1 < order.length ? index + 1 : 0
        const nextId = order[nextIndex]
        if (!nextId) return
        setActiveId(nextId, cause)
      },

      prev: (cause: ActivationCause = 'keyboard') => {
        const { state: currentState, order, setActiveId } = get()
        if (!order.length) return
        const index = currentState.activeId
          ? order.indexOf(currentState.activeId)
          : order.length - 1
        const nextIndex = index > 0 ? index - 1 : order.length - 1
        const nextId = order[nextIndex]
        if (!nextId) return
        setActiveId(nextId, cause)
      },
    })),
  )

  // Create a compatibility wrapper that matches the old SurfaceStore interface
  const store: SurfaceStore<T> = {
    subscribe(cb: () => void) {
      return useStore.subscribe(() => cb())
    },
    snapshot() {
      return useStore.getState().state
    },
    set: useStore.getState().set,
    getNodes: useStore.getState().getNodes,
    setNodes: useStore.getState().setNodes,
    registerRow: useStore.getState().registerRow,
    unregisterRow: useStore.getState().unregisterRow,
    getOrder: useStore.getState().getOrder,
    resetOrder: useStore.getState().resetOrder,
    resetVirtualIndexMap: useStore.getState().resetVirtualIndexMap,
    setActiveId: useStore.getState().setActiveId,
    setActiveByIndex: useStore.getState().setActiveByIndex,
    first: useStore.getState().first,
    last: useStore.getState().last,
    next: useStore.getState().next,
    prev: useStore.getState().prev,
    get rows() {
      return useStore.getState().rows
    },
    get rowIdToVirtualIndex() {
      return useStore.getState().rowIdToVirtualIndex
    },
    inputRef,
    listRef,
    virtualizerRef,
  }

  // Store the Zustand hook internally for optimized access
  ;(store as any).__useStore = useStore

  return store
}
