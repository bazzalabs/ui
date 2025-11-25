import type { ActivationCause, SurfaceRefs } from '@bazza-ui/menu'
import * as React from 'react'
import { create, type StoreApi } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { SelectMenu, SelectMenuDef, SelectNode } from '../types.js'
import type {
  CreateMultiSelectStoreOptions,
  CreateSelectStoreOptions,
  SelectionState,
  SelectMenuStore,
  SelectMenuStoreState,
  SelectSurfaceSlice,
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
 * Creates a single-select store with selection state.
 *
 * @example
 * ```ts
 * const store = createSelectStore({ scopeId: 'my-select' })
 *
 * // Access state
 * const value = store.getState().selection.value
 *
 * // Subscribe to changes
 * store.subscribe((state) => console.log('State changed:', state))
 * ```
 */
export function createSelectStore<TData = unknown>(
  options: CreateSelectStoreOptions,
): StoreApi<SelectMenuStore<TData>> {
  return createSelectStoreInternal<TData>({
    ...options,
    selection: {
      mode: 'single',
      value: options.defaultValue,
    },
  })
}

/**
 * Creates a multi-select store with array-based selection state.
 *
 * @example
 * ```ts
 * const store = createMultiSelectStore({
 *   scopeId: 'my-multi-select',
 *   max: 3,
 * })
 *
 * // Access state
 * const values = store.getState().selection.values
 *
 * // Subscribe to changes
 * store.subscribe((state) => console.log('State changed:', state))
 * ```
 */
export function createMultiSelectStore<TData = unknown>(
  options: CreateMultiSelectStoreOptions,
): StoreApi<SelectMenuStore<TData>> {
  return createSelectStoreInternal<TData>({
    ...options,
    selection: {
      mode: 'multi',
      values: options.defaultValues ?? [],
      max: options.max,
      min: options.min,
    },
  })
}

/**
 * Internal factory that creates the store with the provided selection state.
 */
function createSelectStoreInternal<TData = unknown>(
  options: (CreateSelectStoreOptions | CreateMultiSelectStoreOptions) & {
    selection: SelectionState
  },
): StoreApi<SelectMenuStore<TData>> {
  const aimGuardTimeoutMs =
    options.aimGuardTimeoutMs ?? DEFAULT_AIM_GUARD_TIMEOUT_MS

  type Store = SelectMenuStore<TData>
  type Surface = SelectSurfaceSlice<TData>

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

      // Initial state
      const initialState: SelectMenuStoreState<TData> = {
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
        aimGuard: {
          active: false,
          guardedTriggerId: null,
          guardedSurfaceId: null,
          timeoutId: null,
        },
        selection: options.selection,
      }

      return {
        ...initialState,

        // ═══════════════════════════════════════════════════════════════
        // Root Actions
        // ═══════════════════════════════════════════════════════════════
        setOpen: (open: boolean) =>
          set((state) => ({ root: { ...state.root, open } }) as Partial<Store>),

        setDisabled: (disabled: boolean) =>
          set(
            (state) =>
              ({ root: { ...state.root, disabled } }) as Partial<Store>,
          ),

        setKeyboard: (
          opts: Partial<{ dir: 'ltr' | 'rtl'; vimBindings: boolean }>,
        ) =>
          set(
            (state) =>
              ({ keyboard: { ...state.keyboard, ...opts } }) as Partial<Store>,
          ),

        // ═══════════════════════════════════════════════════════════════
        // Surface Lifecycle
        // ═══════════════════════════════════════════════════════════════
        registerSurface: (
          id: string,
          opts: {
            depth: number
            parentId?: string
            menuDef?: SelectMenuDef<TData>
          },
        ) =>
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
              hover: {
                suppressHoverOpen: false,
                hoveredId: null,
                hoverTimestamp: 0,
              },
            }
            newSurfaces.set(id, surface)
            return { surfaces: newSurfaces } as Partial<Store>
          }),

        unregisterSurface: (id: string) =>
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
        getSurfaceRefs: (surfaceId: string) => {
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
        setSurfaceOpen: (surfaceId: string, open: boolean) =>
          updateSurface(surfaceId, () => ({ open })),

        setSurfaceQuery: (surfaceId: string, query: string) =>
          updateSurface(surfaceId, () => ({ query })),

        setSurfaceActiveId: (
          surfaceId: string,
          id: string | null,
          cause: ActivationCause = 'keyboard',
        ) => {
          setActiveIdWithScroll(surfaceId, id, cause)
        },

        setSurfaceInputActive: (surfaceId: string, inputActive: boolean) =>
          updateSurface(surfaceId, () => ({ inputActive })),

        // ═══════════════════════════════════════════════════════════════
        // Node Updates
        // ═══════════════════════════════════════════════════════════════
        setSurfaceMenu: (surfaceId: string, menu: SelectMenu<TData>) =>
          updateSurface(surfaceId, () => ({ menu })),

        setSurfaceFilteredNodes: (
          surfaceId: string,
          filteredNodes: SelectNode<TData>[],
        ) => updateSurface(surfaceId, () => ({ filteredNodes })),

        setSurfaceDisplayNodes: (
          surfaceId: string,
          displayNodes: SelectNode<TData>[],
        ) => updateSurface(surfaceId, () => ({ displayNodes })),

        updateSurfaceMenuDef: (
          surfaceId: string,
          menuDef: SelectMenuDef<TData>,
        ) => updateSurface(surfaceId, () => ({ menuDef })),

        // ═══════════════════════════════════════════════════════════════
        // Loading State
        // ═══════════════════════════════════════════════════════════════
        setSurfaceLoading: (surfaceId: string, isLoading: boolean) =>
          updateSurface(surfaceId, () => ({ isLoading })),

        setSurfaceError: (surfaceId: string, error: Error | null) =>
          updateSurface(surfaceId, () => ({ error })),

        setSurfaceLoadingProgress: (
          surfaceId: string,
          loadingProgress: Surface['loadingProgress'],
        ) => updateSurface(surfaceId, () => ({ loadingProgress })),

        // ═══════════════════════════════════════════════════════════════
        // Focus
        // ═══════════════════════════════════════════════════════════════
        setFocusOwner: (ownerId: string | null) =>
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

        closeSurfacesFromDepth: (depth: number) =>
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
        // Hover Actions (inherited from popup pattern)
        // ═══════════════════════════════════════════════════════════════
        setSurfaceHoveredId: (surfaceId: string, id: string | null) => {
          updateSurface(surfaceId, (surface) => ({
            hover: {
              ...surface.hover,
              hoveredId: id,
              hoverTimestamp: id ? Date.now() : 0,
            },
          }))
        },

        setSurfaceSuppressHoverOpen: (surfaceId: string, suppress: boolean) => {
          updateSurface(surfaceId, (surface) => ({
            hover: { ...surface.hover, suppressHoverOpen: suppress },
          }))
        },

        clearSurfaceSuppressHoverOpen: (surfaceId: string) => {
          updateSurface(surfaceId, (surface) =>
            surface.hover.suppressHoverOpen
              ? { hover: { ...surface.hover, suppressHoverOpen: false } }
              : {},
          )
        },

        // ═══════════════════════════════════════════════════════════════
        // Aim Guard Actions (inherited from popup pattern)
        // ═══════════════════════════════════════════════════════════════
        activateAimGuard: (
          triggerId: string,
          surfaceId: string,
          timeoutMs: number = aimGuardTimeoutMs,
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

        isAimGuardBlocking: (rowId: string) => {
          const { active, guardedTriggerId } = get().aimGuard
          return active && guardedTriggerId !== rowId
        },

        // ═══════════════════════════════════════════════════════════════
        // Selection Actions (select-specific)
        // ═══════════════════════════════════════════════════════════════
        setValue: (value: string | undefined) => {
          const state = get()
          if (state.selection.mode !== 'single') {
            if (process.env.NODE_ENV === 'development') {
              console.warn(
                '[Select Store] setValue called on multi-select store. Use setValues instead.',
              )
            }
            return
          }
          set({
            selection: { ...state.selection, value },
          } as Partial<Store>)
        },

        setValues: (values: string[]) => {
          const state = get()
          if (state.selection.mode !== 'multi') {
            if (process.env.NODE_ENV === 'development') {
              console.warn(
                '[Select Store] setValues called on single-select store. Use setValue instead.',
              )
            }
            return
          }
          // Respect max constraint
          const { max } = state.selection
          const constrainedValues =
            max !== undefined ? values.slice(0, max) : values
          set({
            selection: { ...state.selection, values: constrainedValues },
          } as Partial<Store>)
        },

        toggleValue: (value: string) => {
          const state = get()
          if (state.selection.mode !== 'multi') {
            // In single mode, toggle means set or clear
            if (state.selection.value === value) {
              set({
                selection: { ...state.selection, value: undefined },
              } as Partial<Store>)
            } else {
              set({
                selection: { ...state.selection, value },
              } as Partial<Store>)
            }
            return
          }

          const { values, max, min } = state.selection
          const isSelected = values.includes(value)

          if (isSelected) {
            // Remove (respect min constraint)
            if (min !== undefined && values.length <= min) {
              return // Can't remove, at minimum
            }
            set({
              selection: {
                ...state.selection,
                values: values.filter((v) => v !== value),
              },
            } as Partial<Store>)
          } else {
            // Add (respect max constraint)
            if (max !== undefined && values.length >= max) {
              return // Can't add, at maximum
            }
            set({
              selection: {
                ...state.selection,
                values: [...values, value],
              },
            } as Partial<Store>)
          }
        },

        isSelected: (value: string) => {
          const state = get()
          if (state.selection.mode === 'single') {
            return state.selection.value === value
          }
          return state.selection.values.includes(value)
        },

        selectAll: (availableValues: string[]) => {
          const state = get()
          if (state.selection.mode !== 'multi') {
            if (process.env.NODE_ENV === 'development') {
              console.warn(
                '[Select Store] selectAll called on single-select store.',
              )
            }
            return
          }
          const { max } = state.selection
          const constrainedValues =
            max !== undefined ? availableValues.slice(0, max) : availableValues
          set({
            selection: { ...state.selection, values: constrainedValues },
          } as Partial<Store>)
        },

        clearAll: () => {
          const state = get()
          if (state.selection.mode !== 'multi') {
            // In single mode, just clear the value
            set({
              selection: { ...state.selection, value: undefined },
            } as Partial<Store>)
            return
          }
          const { min } = state.selection
          if (min !== undefined && min > 0) {
            // Can't clear all, respect minimum
            if (process.env.NODE_ENV === 'development') {
              console.warn(
                `[Select Store] Cannot clear all selections. Minimum ${min} required.`,
              )
            }
            return
          }
          set({
            selection: { ...state.selection, values: [] },
          } as Partial<Store>)
        },

        isAtMax: () => {
          const state = get()
          if (state.selection.mode !== 'multi') {
            return false
          }
          const { values, max } = state.selection
          return max !== undefined && values.length >= max
        },

        isAtMin: () => {
          const state = get()
          if (state.selection.mode !== 'multi') {
            return false
          }
          const { values, min } = state.selection
          return min !== undefined && values.length <= min
        },

        getSelectionCount: () => {
          const state = get()
          if (state.selection.mode === 'single') {
            return state.selection.value !== undefined ? 1 : 0
          }
          return state.selection.values.length
        },
      }
    }),
  )
}
