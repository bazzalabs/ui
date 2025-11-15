import type { MenuDef } from '@bazza-ui/menu'
import * as React from 'react'
import type { CommandMenuThemeDef, NavigationStackEntry } from './types.js'

export type CommandMenuContextValue<T = unknown> = {
  /** Current menu being displayed */
  currentMenu: MenuDef<T>
  /** Navigation stack for paged navigation */
  navigationStack: NavigationStackEntry[]
  /** Push a submenu onto the stack */
  pushSubmenu: (entry: NavigationStackEntry, submenu: MenuDef<any>) => void
  /** Pop the current submenu from the stack */
  popSubmenu: () => void
  /** Clear the entire navigation stack */
  clearStack: () => void
  /** Whether we're in a submenu (stack has items) */
  isInSubmenu: boolean
  /** Whether to show breadcrumbs */
  showBreadcrumbs: boolean
  /** Vim bindings enabled */
  vimBindings: boolean
  /** Text direction */
  dir: 'ltr' | 'rtl'
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void
  /** Callback when query changes (for clearing on navigation) */
  onQueryChange?: (query: string) => void
  /** Ref to the input element for focus management */
  inputRef: React.RefObject<HTMLInputElement>
}

const CommandMenuContext =
  React.createContext<CommandMenuContextValue<any> | null>(null)

export function useCommandMenuContext<
  T = unknown,
>(): CommandMenuContextValue<T> {
  const ctx = React.useContext(
    CommandMenuContext,
  ) as CommandMenuContextValue<T> | null
  if (!ctx) {
    throw new Error('useCommandMenuContext must be used within a CommandMenu')
  }
  return ctx
}

export const CommandMenuProvider =
  CommandMenuContext.Provider as React.Provider<CommandMenuContextValue<any>>
