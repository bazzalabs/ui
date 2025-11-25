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
 * Creates a popup menu store with hover and aim guard extensions.
 *
 * Note: This is a full implementation rather than extending createBaseMenuStore
 * because we need to customize the surface registration to include hover state.
 *
 * @example
 * ```ts
 * const store = createPopupMenuStore({ scopeId: 'my-dropdown' })
 *
 * // Access state
 * const open = store.getState().root.open
 *
 * // Subscribe to changes
 * store.subscribe((state) => console.log('State changed:', state))
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
        // Surface Lifecycle (extended with hover state)
        // ═══════════════════════════════════════════════════════════════
        registerSurface: (id, opts) =>
          set((state) => {
            const newSurfaces = new Map(state.surfaces)
            const surface: Surface = {
              id,
              depth: opts.depth,
              parentId: opts.parentId,
              open: opts.depth === 0,
              query: '',
              activeId: null,
              inputActive: false,
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
        // Surface State Updates
        // ═══════════════════════════════════════════════════════════════
        setSurfaceOpen: (surfaceId, open) =>
          updateSurface(surfaceId, () => ({ open })),

        setSurfaceQuery: (surfaceId, query) =>
          updateSurface(surfaceId, () => ({ query })),

        setSurfaceActiveId: (surfaceId, activeId) =>
          updateSurface(surfaceId, () => ({ activeId })),

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
