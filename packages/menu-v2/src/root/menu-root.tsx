'use client'

import * as React from 'react'
import { useId } from '@base-ui/utils/useId'
import { MenuStore } from '../store/index.js'
import {
  MenuRootContext,
  type MenuRootContextValue,
} from './menu-root-context.js'
import type { Direction } from '../store/types.js'

/**
 * State for the MenuRoot component
 */
export interface MenuRootState {
  /** Whether the menu is open */
  open: boolean
  /** Whether the menu is disabled */
  disabled: boolean
}

/**
 * Props for the MenuRoot component
 */
export interface MenuRootProps {
  /** The content of the menu */
  children?: React.ReactNode
  /**
   * Whether the menu is open (controlled).
   */
  open?: boolean
  /**
   * The default open state (uncontrolled).
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Callback fired when the open state changes.
   */
  onOpenChange?: (open: boolean) => void
  /**
   * Whether the menu is disabled.
   * @default false
   */
  disabled?: boolean
  /**
   * The text direction.
   * @default 'ltr'
   */
  direction?: Direction
  /**
   * Whether vim-style keybindings are enabled.
   * @default false
   */
  vimBindings?: boolean
  /**
   * Whether keyboard navigation should loop.
   * @default true
   */
  loop?: boolean
  /**
   * An external store to use instead of creating one internally.
   * Useful for sharing state between components.
   */
  store?: MenuStore
}

export namespace MenuRoot {
  export type State = MenuRootState
  export type Props = MenuRootProps
}

/**
 * Groups all parts of the menu.
 * Provides context and state management for the menu.
 *
 * Does not render its own HTML element.
 */
export function MenuRoot(props: MenuRoot.Props): React.ReactNode {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    disabled = false,
    direction = 'ltr',
    vimBindings = false,
    loop = true,
    store: externalStore,
  } = props

  const reactId = React.useId()
  const menuId = useId() ?? reactId

  // Create or use external store
  const store = MenuStore.useStore(externalStore, {
    open: openProp ?? defaultOpen,
    disabled,
    direction,
    vimBindings,
    loop,
  })

  // Handle controlled open state
  store.useControlledProp('open', openProp, defaultOpen)

  // Sync props to store
  store.useSyncedValues({
    disabled,
    direction,
    vimBindings,
    loop,
  })

  // Store callbacks in context
  store.useContextCallback('onOpenChange', onOpenChange)

  const contextValue = React.useMemo<MenuRootContextValue>(
    () => ({
      store,
      menuId,
    }),
    [store, menuId],
  )

  return (
    <MenuRootContext.Provider value={contextValue}>
      {children}
    </MenuRootContext.Provider>
  )
}

MenuRoot.displayName = 'MenuRoot'
