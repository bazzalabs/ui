import type { ActivationCause, RowRecord, SurfaceRefs } from '@bazza-ui/menu'
import * as React from 'react'
import { create, type StoreApi } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { PopupMenu, PopupMenuDef, PopupNode } from '../types.js'
import type {
  CreatePopupMenuStoreOptions,
  PopupMenuStore,
  PopupSurfaceSlice,
} from './types.js'

const DEFAULT_AIM_GUARD_TIMEOUT_MS = 450

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
 * Creates a popup menu store with hover and aim guard extensions.
 *
 * This store manages:
 * - Surface lifecycle (registration, refs, DOM state)
 * - Row registry (for keyboard navigation)
 * - Navigation (first, last, next, prev)
 * - Hover state and aim guard (for submenu hover behavior)
 *
 * @example
 * ```ts
 * const store = createPopupMenuStore({ scopeId: 'my-dropdown' })
 *
 * // Access state
 * const open = store.getState().root.open
 *
 * // Navigate
 * store.getState().next('surface-1', 'keyboard')
 * ```
 */
export function createPopupMenuStore<TData = unknown>(
  options: CreatePopupMenuStoreOptions,
): StoreApi<PopupMenuStore<TData>> {
  const aimGuardTimeoutMs =
    options.aimGuardTimeoutMs ?? DEFAULT_AIM_GUARD_TIMEOUT_MS

  type Store = PopupMenuStore<TData>
  type Surface = PopupSurfaceSlice<TData>

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

      return {
        // ═══════════════════════════════════════════════════════════════
        // Base State
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
        // Popup Extension State
        // ═══════════════════════════════════════════════════════════════
        aimGuard: {
          active: false,
          guardedTriggerId: null,
          guardedSurfaceId: null,
          timeoutId: null,
        },

        // ═══════════════════════════════════════════════════════════════
        // Root Actions
        // ═══════════════════════════════════════════════════════════════
        setOpen: (open) =>
          set((state) => ({ root: { ...state.root, open } }) as Partial<Store>),

        setDisabled: (disabled) =>
          set(
            (state) =>
              ({ root: { ...state.root, disabled } }) as Partial<Store>,
          ),

        setKeyboard: (opts) =>
          set(
            (state) =>
              ({ keyboard: { ...state.keyboard, ...opts } }) as Partial<Store>,
          ),

        // ═══════════════════════════════════════════════════════════════
        // Surface Lifecycle (with refs, rows, order)
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
              open: opts.depth === 0,
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
              // Popup-specific hover state
              hover: {
                suppressHoverOpen: false,
                hoveredId: null,
                hoverTimestamp: 0,
              },
            }
            newSurfaces.set(id, surface)
            return { surfaces: newSurfaces } as Partial<Store>
          }),

        unregisterSurface: (id) =>
          set((state) => {
            const newSurfaces = new Map(state.surfaces)
            newSurfaces.delete(id)
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
        setSurfaceActiveId: (surfaceId, id, cause = 'keyboard') => {
          setActiveIdWithScroll(surfaceId, id, cause)
        },

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
            Array.from(newSurfaces.entries()).forEach(([id, surface]) => {
              newSurfaces.set(id, { ...surface, open: false })
            })
            return {
              surfaces: newSurfaces,
              root: { ...state.root, open: false },
              focus: { ownerId: null },
            } as Partial<Store>
          }),

        closeSurfacesFromDepth: (depth) =>
          set((state) => {
            const newSurfaces = new Map(state.surfaces)
            const toClose = Array.from(newSurfaces.values())
              .filter((s) => s.depth >= depth)
              .sort((a, b) => b.depth - a.depth)

            for (const surface of toClose) {
              newSurfaces.set(surface.id, { ...surface, open: false })
            }
            return { surfaces: newSurfaces } as Partial<Store>
          }),

        // ═══════════════════════════════════════════════════════════════
        // Hover Actions (popup-specific)
        // ═══════════════════════════════════════════════════════════════
        setSurfaceHoveredId: (surfaceId, id) => {
          updateSurface(surfaceId, (surface) => ({
            hover: {
              ...surface.hover,
              hoveredId: id,
              hoverTimestamp: id ? Date.now() : 0,
            },
          }))
        },

        setSurfaceSuppressHoverOpen: (surfaceId, suppress) => {
          updateSurface(surfaceId, (surface) => ({
            hover: { ...surface.hover, suppressHoverOpen: suppress },
          }))
        },

        clearSurfaceSuppressHoverOpen: (surfaceId) => {
          updateSurface(surfaceId, (surface) =>
            surface.hover.suppressHoverOpen
              ? { hover: { ...surface.hover, suppressHoverOpen: false } }
              : {},
          )
        },

        // ═══════════════════════════════════════════════════════════════
        // Aim Guard Actions (popup-specific, global)
        // ═══════════════════════════════════════════════════════════════
        activateAimGuard: (
          triggerId,
          surfaceId,
          timeoutMs = aimGuardTimeoutMs,
        ) => {
          const currentTimeoutId = get().aimGuard.timeoutId
          if (currentTimeoutId) {
            window.clearTimeout(currentTimeoutId)
          }

          const newTimeoutId = window.setTimeout(() => {
            set({
              aimGuard: {
                active: false,
                guardedTriggerId: null,
                guardedSurfaceId: null,
                timeoutId: null,
              },
            } as Partial<Store>)
          }, timeoutMs) as unknown as number

          set({
            aimGuard: {
              active: true,
              guardedTriggerId: triggerId,
              guardedSurfaceId: surfaceId,
              timeoutId: newTimeoutId,
            },
          } as Partial<Store>)
        },

        clearAimGuard: () => {
          const currentTimeoutId = get().aimGuard.timeoutId
          if (currentTimeoutId) {
            window.clearTimeout(currentTimeoutId)
          }
          set({
            aimGuard: {
              active: false,
              guardedTriggerId: null,
              guardedSurfaceId: null,
              timeoutId: null,
            },
          } as Partial<Store>)
        },

        isAimGuardBlocking: (rowId) => {
          const { active, guardedTriggerId } = get().aimGuard
          return active && guardedTriggerId !== rowId
        },
      }
    }),
  )
}
