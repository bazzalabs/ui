import { create, type StoreApi } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  CommandMenu,
  CommandMenuDef,
  CommandNode,
  CommandSubmenuDef,
  NavigationStackEntry,
} from '../types.js'
import type {
  CommandMenuStore,
  CommandSurfaceSlice,
  CreateCommandMenuStoreOptions,
} from './types.js'

/**
 * Deep search for a submenu node by ID anywhere in the tree.
 */
function findSubmenuDeep<TData>(
  nodes: CommandMenuDef<TData>['nodes'],
  submenuId: string,
): CommandSubmenuDef<TData, any> | undefined {
  if (!nodes) return undefined
  for (const node of nodes) {
    if (node.kind === 'submenu' && node.id === submenuId) {
      return node as CommandSubmenuDef<TData, any>
    }
    if (
      node.kind === 'submenu' &&
      (node as CommandSubmenuDef<TData, any>).nodes
    ) {
      const found = findSubmenuDeep(
        (node as CommandSubmenuDef<TData, any>).nodes,
        submenuId,
      )
      if (found) return found
    }
  }
  return undefined
}

/**
 * Derive current menu definition from root menu and navigation stack.
 */
function deriveCurrentMenu<TData>(
  rootMenu: CommandMenuDef<TData>,
  stack: NavigationStackEntry[],
): CommandMenuDef<TData> {
  if (stack.length === 0) {
    return rootMenu
  }

  let currentMenuDef: CommandMenuDef<any> = rootMenu
  let isFirstEntry = true

  for (const entry of stack) {
    const nodes = currentMenuDef.nodes || []
    let submenuNode = nodes.find(
      (n): n is CommandSubmenuDef<any, any> =>
        n.kind === 'submenu' && n.id === entry.menuId,
    )

    // If not found and first entry, try deep search (for deep search results)
    if (!submenuNode && isFirstEntry) {
      submenuNode = findSubmenuDeep(rootMenu.nodes, entry.menuId)
    }
    isFirstEntry = false

    if (submenuNode) {
      // Check if this submenu has injected deep search results
      const hasInjectedResults = (submenuNode as any).__originalLoader

      // Convert SubmenuDef to MenuDef
      currentMenuDef = {
        id: submenuNode.id || entry.menuId,
        title: submenuNode.title,
        nodes: hasInjectedResults ? undefined : submenuNode.nodes,
        loader: hasInjectedResults
          ? (submenuNode as any).__originalLoader
          : submenuNode.loader,
        search: submenuNode.search,
        defaults: submenuNode.defaults,
        ui: submenuNode.ui,
        virtualization: submenuNode.virtualization,
        inputPlaceholder: submenuNode.inputPlaceholder,
        hideSearchUntilActive: submenuNode.hideSearchUntilActive,
        input: submenuNode.input,
        open: submenuNode.open,
        middleware: submenuNode.middleware,
      } as CommandMenuDef<any>
    } else {
      console.warn(`Submenu not found: ${entry.menuId}`)
      return rootMenu
    }
  }

  return currentMenuDef
}

/**
 * Creates a command menu store with navigation stack extensions.
 *
 * @example
 * ```ts
 * const store = createCommandMenuStore({ scopeId: 'my-command-menu' })
 *
 * // Navigate to a submenu
 * store.getState().pushSubmenu({ menuId: 'settings', menuTitle: 'Settings' })
 *
 * // Navigate back
 * store.getState().popSubmenu()
 * ```
 */
export function createCommandMenuStore<TData = unknown>(
  options: CreateCommandMenuStoreOptions,
): StoreApi<CommandMenuStore<TData>> {
  type Store = CommandMenuStore<TData>
  type Surface = CommandSurfaceSlice<TData>

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

      // Create empty menu def as placeholder
      const emptyMenuDef: CommandMenuDef<TData> = { id: '__empty__' }

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
        // Command Menu Extension State
        // ═══════════════════════════════════════════════════════════════
        navigation: {
          stack: [],
          currentMenuDef: emptyMenuDef,
          isInSubmenu: false,
        },
        rootMenuDef: null,
        ui: {
          showBreadcrumbs: options.showBreadcrumbs ?? true,
        },

        // ═══════════════════════════════════════════════════════════════
        // Root Actions
        // ═══════════════════════════════════════════════════════════════
        setOpen: (open) =>
          set((state) => {
            // When closing, clear navigation stack
            if (!open && state.navigation.stack.length > 0) {
              return {
                root: { ...state.root, open },
                navigation: {
                  stack: [],
                  currentMenuDef: state.rootMenuDef ?? emptyMenuDef,
                  isInSubmenu: false,
                },
              } as Partial<Store>
            }
            return { root: { ...state.root, open } } as Partial<Store>
          }),

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
        // Surface Lifecycle
        // ═══════════════════════════════════════════════════════════════
        registerSurface: (id, opts) =>
          set((state) => {
            const newSurfaces = new Map(state.surfaces)
            const surface: Surface = {
              id,
              depth: opts.depth,
              parentId: opts.parentId ?? null,
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
              // Clear navigation on close
              navigation: {
                stack: [],
                currentMenuDef: state.rootMenuDef ?? emptyMenuDef,
                isInSubmenu: false,
              },
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
        // Navigation Actions (command-menu specific)
        // ═══════════════════════════════════════════════════════════════
        setRootMenuDef: (menuDef) =>
          set({
            rootMenuDef: menuDef,
            navigation: {
              stack: [],
              currentMenuDef: menuDef,
              isInSubmenu: false,
            },
          } as Partial<Store>),

        pushSubmenu: (entry) =>
          set((state) => {
            if (!state.rootMenuDef) return state
            const newStack = [...state.navigation.stack, entry]
            const newCurrentMenu = deriveCurrentMenu(
              state.rootMenuDef,
              newStack,
            )
            return {
              navigation: {
                stack: newStack,
                currentMenuDef: newCurrentMenu,
                isInSubmenu: true,
              },
            } as Partial<Store>
          }),

        popSubmenu: () =>
          set((state) => {
            if (!state.rootMenuDef || state.navigation.stack.length === 0) {
              return state
            }
            const newStack = state.navigation.stack.slice(0, -1)
            const newCurrentMenu = deriveCurrentMenu(
              state.rootMenuDef,
              newStack,
            )
            return {
              navigation: {
                stack: newStack,
                currentMenuDef: newCurrentMenu,
                isInSubmenu: newStack.length > 0,
              },
            } as Partial<Store>
          }),

        clearNavigationStack: () =>
          set(
            (state) =>
              ({
                navigation: {
                  stack: [],
                  currentMenuDef: state.rootMenuDef ?? emptyMenuDef,
                  isInSubmenu: false,
                },
              }) as Partial<Store>,
          ),

        // ═══════════════════════════════════════════════════════════════
        // UI Actions (command-menu specific)
        // ═══════════════════════════════════════════════════════════════
        setShowBreadcrumbs: (show) =>
          set({ ui: { showBreadcrumbs: show } } as Partial<Store>),
      }
    }),
  )
}
