import { create, type StoreApi } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Menu, Node, RootMenuDef } from '../types.js'
import type {
  BaseMenuStore,
  CreateBaseMenuStoreOptions,
  MenuDefLike,
  MenuLike,
  MenuSurfaceSlice,
  NodeLike,
  StoreExtension,
} from './types.js'

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
            const surface: Surface = {
              id,
              depth: opts.depth,
              parentId: opts.parentId ?? null,
              open: opts.depth === 0, // Root starts open when menu opens
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
