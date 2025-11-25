import * as React from 'react'
import { create, type StoreApi } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { ActivationCause, Menu, Node, RootMenuDef } from '../types.js'
import type {
  BaseMenuStore,
  CreateBaseMenuStoreOptions,
  MenuDefLike,
  MenuLike,
  MenuSurfaceSlice,
  NodeLike,
  StoreExtension,
  SurfaceRefs,
} from './types.js'

/**
 * Creates refs for a new surface.
 * Refs are created once when the surface registers and reused throughout its lifecycle.
 */
function createSurfaceRefs(): SurfaceRefs {
  return {
    inputRef: React.createRef<HTMLInputElement | null>(),
    listRef: React.createRef<HTMLDivElement | null>(),
    virtualizerRef: React.createRef<any>(),
    ignorePointerRef: { current: false },
  }
}

/**
 * Creates a base menu store with full generic support.
 * Consumer packages extend this with their specific types and state.
 *
 * @typeParam TData - Data type for menu items
 * @typeParam TMenuDef - Menu definition type
 * @typeParam TMenu - Runtime menu type
 * @typeParam TNode - Runtime node type
 * @typeParam TExtension - Extension state/actions added by consumer
 *
 * @example
 * ```ts
 * // Basic usage
 * const store = createBaseMenuStore({ scopeId: 'my-menu' })
 *
 * // With extension
 * const store = createBaseMenuStore(
 *   { scopeId: 'my-menu' },
 *   (set, get) => ({
 *     customState: 'value',
 *     customAction: () => set({ customState: 'new' }),
 *   })
 * )
 * ```
 */
export function createBaseMenuStore<
  TData = unknown,
  TMenuDef extends MenuDefLike = RootMenuDef<TData>,
  TMenu extends MenuLike = Menu<TData>,
  TNode extends NodeLike = Node<TData>,
  TExtension = object,
>(
  options: CreateBaseMenuStoreOptions,
  extend?: StoreExtension<TData, TMenuDef, TMenu, TNode, TExtension>,
): StoreApi<BaseMenuStore<TData, TMenuDef, TMenu, TNode> & TExtension> {
  type Store = BaseMenuStore<TData, TMenuDef, TMenu, TNode> & TExtension
  type Surface = MenuSurfaceSlice<TData, TMenuDef, TMenu, TNode>

  return create<Store>()(
    subscribeWithSelector((set, get) => {
      // Helper to update a surface immutably
      const updateSurface = (
        surfaceId: string,
        updater: (surface: Surface) => Partial<Surface>,
      ) => {
        set((state) => {
          const surface = state.surfaces.get(surfaceId)
          if (!surface) return state
          const newSurfaces = new Map(state.surfaces)
          newSurfaces.set(surfaceId, { ...surface, ...updater(surface) })
          return { surfaces: newSurfaces } as Partial<Store>
        })
      }

      // Helper for setActiveId with scroll behavior
      const setActiveIdWithScroll = (
        surfaceId: string,
        id: string | null,
        cause: ActivationCause = 'keyboard',
      ) => {
        const state = get()
        const surface = state.surfaces.get(surfaceId)
        if (!surface) return

        const prev = surface.activeId
        if (Object.is(prev, id)) return

        // Close any open submenu that is not the active trigger BEFORE updating activeId
        for (const [rid, rec] of surface.rows) {
          if (rec.kind === 'submenu' && rec.closeSub && rid !== id) {
            try {
              rec.closeSub()
            } catch {}
          }
        }

        // Update activeId
        updateSurface(surfaceId, () => ({ activeId: id }))

        // Scroll active row into view when keyboard navigating
        if (cause !== 'keyboard') return
        if (id === null) return

        const row = surface.rows.get(id)
        const index = surface.order.indexOf(id)
        const el = row?.ref.current
        const listEl = surface.refs.listRef.current
        if (el && listEl) {
          try {
            const inList = listEl.contains(el)
            if (inList) el.scrollIntoView({ block: 'nearest' })
          } catch {}
          return
        }

        // Use virtual index for scrolling
        const virtualIndex = surface.rowIdToVirtualIndex.get(id)
        if (
          virtualIndex !== undefined &&
          (index === 0 || index === surface.order.length - 1)
        ) {
          surface.refs.virtualizerRef.current?.scrollToIndex(virtualIndex)
        }
      }

      const baseStore: BaseMenuStore<TData, TMenuDef, TMenu, TNode> = {
        // ═══════════════════════════════════════════════════════════════
        // State
        // ═══════════════════════════════════════════════════════════════
        root: {
          scopeId: options.scopeId,
          open: false,
          disabled: false,
        },
        surfaces: new Map(),
        focus: { ownerId: null },
        keyboard: {
          dir: options.dir ?? 'ltr',
          vimBindings: options.vimBindings ?? true,
        },

        // ═══════════════════════════════════════════════════════════════
        // Root Actions
        // ═══════════════════════════════════════════════════════════════
        setOpen: (open) =>
          set(
            (state) =>
              ({
                root: { ...state.root, open },
              }) as Partial<Store>,
          ),

        setDisabled: (disabled) =>
          set(
            (state) =>
              ({
                root: { ...state.root, disabled },
              }) as Partial<Store>,
          ),

        setKeyboard: (opts) =>
          set(
            (state) =>
              ({
                keyboard: { ...state.keyboard, ...opts },
              }) as Partial<Store>,
          ),

        // ═══════════════════════════════════════════════════════════════
        // Surface Lifecycle
        // ═══════════════════════════════════════════════════════════════
        registerSurface: (id, opts) =>
          set((state) => {
            const newSurfaces = new Map(state.surfaces)
            // Create refs once on registration
            const refs = createSurfaceRefs()
            const surface: Surface = {
              id,
              depth: opts.depth,
              parentId: opts.parentId ?? null,
              open: opts.depth === 0, // Root starts open when menu opens
              query: '',
              activeId: null,
              inputActive: false,
              // Refs and row registry
              refs,
              rows: new Map(),
              rowIdToVirtualIndex: new Map(),
              order: [],
              // Node state
              menuDef: opts.menuDef,
              menu: null,
              filteredNodes: [],
              displayNodes: [],
              isLoading: false,
              error: null,
              loadingProgress: null,
            }
            newSurfaces.set(id, surface)
            return { surfaces: newSurfaces } as Partial<Store>
          }),

        unregisterSurface: (id) =>
          set((state) => {
            const newSurfaces = new Map(state.surfaces)
            newSurfaces.delete(id)
            // Clear focus if this surface owned it
            const newFocus =
              state.focus.ownerId === id ? { ownerId: null } : state.focus
            return { surfaces: newSurfaces, focus: newFocus } as Partial<Store>
          }),

        // ═══════════════════════════════════════════════════════════════
        // Surface Refs Accessor
        // ═══════════════════════════════════════════════════════════════
        getSurfaceRefs: (surfaceId) => {
          return get().surfaces.get(surfaceId)?.refs
        },

        // ═══════════════════════════════════════════════════════════════
        // Row Registry Actions
        // ═══════════════════════════════════════════════════════════════
        registerRow: (surfaceId, rowId, rec) => {
          updateSurface(surfaceId, (surface) => {
            const newRows = new Map(surface.rows)
            newRows.set(rowId, rec)
            return { rows: newRows }
          })
        },

        unregisterRow: (surfaceId, rowId) => {
          updateSurface(surfaceId, (surface) => {
            const newRows = new Map(surface.rows)
            newRows.delete(rowId)
            return { rows: newRows }
          })
        },

        resetOrder: (surfaceId, ids) => {
          updateSurface(surfaceId, () => ({ order: ids }))
        },

        resetVirtualIndexMap: (surfaceId, map) => {
          updateSurface(surfaceId, () => ({
            rowIdToVirtualIndex: new Map(map),
          }))
        },

        // ═══════════════════════════════════════════════════════════════
        // Navigation Actions
        // ═══════════════════════════════════════════════════════════════
        first: (surfaceId, cause = 'keyboard') => {
          const surface = get().surfaces.get(surfaceId)
          if (!surface || !surface.order.length) return
          const id = surface.order[0]
          if (!id) return
          setActiveIdWithScroll(surfaceId, id, cause)
        },

        last: (surfaceId, cause = 'keyboard') => {
          const surface = get().surfaces.get(surfaceId)
          if (!surface || !surface.order.length) return
          const id = surface.order[surface.order.length - 1]
          if (!id) return
          setActiveIdWithScroll(surfaceId, id, cause)
        },

        next: (surfaceId, cause = 'keyboard') => {
          const surface = get().surfaces.get(surfaceId)
          if (!surface || !surface.order.length) return
          const index = surface.activeId
            ? surface.order.indexOf(surface.activeId)
            : -1
          const nextIndex = index + 1 < surface.order.length ? index + 1 : 0
          const nextId = surface.order[nextIndex]
          if (!nextId) return
          setActiveIdWithScroll(surfaceId, nextId, cause)
        },

        prev: (surfaceId, cause = 'keyboard') => {
          const surface = get().surfaces.get(surfaceId)
          if (!surface || !surface.order.length) return
          const index = surface.activeId
            ? surface.order.indexOf(surface.activeId)
            : surface.order.length
          const nextIndex = index > 0 ? index - 1 : surface.order.length - 1
          const nextId = surface.order[nextIndex]
          if (!nextId) return
          setActiveIdWithScroll(surfaceId, nextId, cause)
        },

        // ═══════════════════════════════════════════════════════════════
        // Surface State Updates
        // ═══════════════════════════════════════════════════════════════
        setSurfaceOpen: (surfaceId, open) =>
          updateSurface(surfaceId, () => ({ open })),

        setSurfaceQuery: (surfaceId, query) =>
          updateSurface(surfaceId, () => ({ query })),

        setSurfaceActiveId: (surfaceId, id, cause = 'keyboard') => {
          setActiveIdWithScroll(surfaceId, id, cause)
        },

        setSurfaceInputActive: (surfaceId, inputActive) =>
          updateSurface(surfaceId, () => ({ inputActive })),

        // ═══════════════════════════════════════════════════════════════
        // Node Updates
        // ═══════════════════════════════════════════════════════════════
        setSurfaceMenu: (surfaceId, menu) =>
          updateSurface(surfaceId, () => ({ menu })),

        setSurfaceFilteredNodes: (surfaceId, filteredNodes) =>
          updateSurface(surfaceId, () => ({ filteredNodes })),

        setSurfaceDisplayNodes: (surfaceId, displayNodes) =>
          updateSurface(surfaceId, () => ({ displayNodes })),

        updateSurfaceMenuDef: (surfaceId, menuDef) =>
          updateSurface(surfaceId, () => ({ menuDef })),

        // ═══════════════════════════════════════════════════════════════
        // Loading State
        // ═══════════════════════════════════════════════════════════════
        setSurfaceLoading: (surfaceId, isLoading) =>
          updateSurface(surfaceId, () => ({ isLoading })),

        setSurfaceError: (surfaceId, error) =>
          updateSurface(surfaceId, () => ({ error })),

        setSurfaceLoadingProgress: (surfaceId, loadingProgress) =>
          updateSurface(surfaceId, () => ({ loadingProgress })),

        // ═══════════════════════════════════════════════════════════════
        // Focus
        // ═══════════════════════════════════════════════════════════════
        setFocusOwner: (ownerId) =>
          set({ focus: { ownerId } } as Partial<Store>),

        // ═══════════════════════════════════════════════════════════════
        // Bulk Actions
        // ═══════════════════════════════════════════════════════════════
        closeAllSurfaces: () =>
          set((state) => {
            const newSurfaces = new Map(state.surfaces)
            for (const [id, surface] of newSurfaces) {
              newSurfaces.set(id, { ...surface, open: false })
            }
            return {
              surfaces: newSurfaces,
              root: { ...state.root, open: false },
              focus: { ownerId: null },
            } as Partial<Store>
          }),

        closeSurfacesFromDepth: (depth) =>
          set((state) => {
            const newSurfaces = new Map(state.surfaces)
            // Sort by depth descending and close
            const toClose = [...newSurfaces.values()]
              .filter((s) => s.depth >= depth)
              .sort((a, b) => b.depth - a.depth)

            for (const surface of toClose) {
              newSurfaces.set(surface.id, { ...surface, open: false })
            }
            return { surfaces: newSurfaces } as Partial<Store>
          }),
      }

      // Apply extensions if provided
      const extension = extend
        ? extend(set as any, get as any)
        : ({} as TExtension)

      return { ...baseStore, ...extension } as Store
    }),
  )
}
