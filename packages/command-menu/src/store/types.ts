import type {
  BaseMenuStoreActions,
  BaseMenuStoreState,
  MenuSurfaceSlice,
} from '@bazza-ui/menu'
import type {
  CommandMenu,
  CommandMenuDef,
  CommandNode,
  NavigationStackEntry,
} from '../types.js'

/* ================================================================================================
 * Command Menu Surface State Extension
 * ============================================================================================== */

/**
 * Extended surface state for command menus.
 * Command menus use a single surface with paged navigation (stack-based).
 */
export type CommandSurfaceSlice<TData = unknown> = MenuSurfaceSlice<
  TData,
  CommandMenuDef<TData>,
  CommandMenu<TData>,
  CommandNode<TData>
>

/* ================================================================================================
 * Navigation State
 * ============================================================================================== */

/**
 * Navigation state for command menus.
 * Tracks the stack of visited submenus for paged navigation.
 */
export type NavigationState<TData = unknown> = {
  /** Stack of navigation entries (breadcrumbs) */
  stack: NavigationStackEntry[]
  /** Current menu definition being displayed */
  currentMenuDef: CommandMenuDef<TData>
  /** Whether we're currently in a submenu */
  isInSubmenu: boolean
}

/* ================================================================================================
 * Command Menu Store State Extension
 * ============================================================================================== */

/**
 * Extended store state for command menus.
 */
export type CommandMenuStoreState<TData = unknown> = Omit<
  BaseMenuStoreState<
    TData,
    CommandMenuDef<TData>,
    CommandMenu<TData>,
    CommandNode<TData>
  >,
  'surfaces'
> & {
  /** Surface registry with command-specific extensions */
  surfaces: Map<string, CommandSurfaceSlice<TData>>
  /** Navigation state (paged submenu navigation) */
  navigation: NavigationState<TData>
  /** Root menu definition (immutable reference to original menu) */
  rootMenuDef: CommandMenuDef<TData> | null
  /** UI preferences */
  ui: {
    showBreadcrumbs: boolean
  }
}

/* ================================================================================================
 * Command Menu Store Actions Extension
 * ============================================================================================== */

/**
 * Extended store actions for command menus.
 */
export type CommandMenuStoreActions<TData = unknown> = BaseMenuStoreActions<
  TData,
  CommandMenuDef<TData>,
  CommandMenu<TData>,
  CommandNode<TData>
> & {
  // Navigation actions
  /**
   * Push a submenu onto the navigation stack (navigate forward)
   */
  pushSubmenu: (entry: NavigationStackEntry) => void
  /**
   * Pop the current submenu from the stack (navigate back)
   */
  popSubmenu: () => void
  /**
   * Clear the entire navigation stack (return to root)
   */
  clearNavigationStack: () => void
  /**
   * Set the root menu definition (called once on mount)
   */
  setRootMenuDef: (menuDef: CommandMenuDef<TData>) => void

  // UI actions
  setShowBreadcrumbs: (show: boolean) => void
}

/* ================================================================================================
 * Complete Command Menu Store Type
 * ============================================================================================== */

/**
 * Complete command menu store type.
 */
export type CommandMenuStore<TData = unknown> = CommandMenuStoreState<TData> &
  CommandMenuStoreActions<TData>

/* ================================================================================================
 * Store Creation Options
 * ============================================================================================== */

/**
 * Options for creating a command menu store.
 */
export interface CreateCommandMenuStoreOptions {
  scopeId: string
  dir?: 'ltr' | 'rtl'
  vimBindings?: boolean
  showBreadcrumbs?: boolean
}

/* ================================================================================================
 * Navigation Change Event (for callbacks)
 * ============================================================================================== */

/**
 * Event fired when submenu navigation occurs.
 */
export type NavigationChangeEvent = {
  direction: 'forward' | 'back'
  prevStack: NavigationStackEntry[]
  nextStack: NavigationStackEntry[]
}
