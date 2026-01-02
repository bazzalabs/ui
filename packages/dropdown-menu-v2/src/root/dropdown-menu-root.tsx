'use client'

import * as React from 'react'
import { Popover } from '@base-ui/react/popover'
import { Menu, MenuStore, type Direction } from '@bazza-ui/menu-v2'
import {
  DropdownMenuRootContext,
  type DropdownMenuRootContextValue,
} from './dropdown-menu-root-context.js'

/**
 * Props for the DropdownMenuRoot component
 */
export interface DropdownMenuRootProps {
  /**
   * The content of the dropdown menu.
   */
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
   * Event handler called when the menu is opened or closed.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: Popover.Root.ChangeEventDetails,
  ) => void
  /**
   * Event handler called after any animations complete when the menu is opened or closed.
   */
  onOpenChangeComplete?: (open: boolean) => void
  /**
   * Determines if the menu enters a modal state when open.
   * - `true`: user interaction is limited to the menu
   * - `false`: user interaction with the rest of the document is allowed
   * - `'trap-focus'`: focus is trapped but scroll is not locked
   * @default false
   */
  modal?: boolean | 'trap-focus'
  /**
   * A ref to imperative actions.
   */
  actionsRef?: React.RefObject<Popover.Root.Actions | null>
  /**
   * Whether the component should ignore user interaction.
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
   */
  store?: MenuStore
}

export namespace DropdownMenuRoot {
  export type Props = DropdownMenuRootProps
}

/**
 * Groups all parts of the dropdown menu.
 * Composes Popover.Root for positioning and Menu.Root for menu behavior.
 *
 * Does not render its own HTML element.
 */
export function DropdownMenuRoot(
  props: DropdownMenuRoot.Props,
): React.ReactNode {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    modal,
    actionsRef,
    disabled = false,
    direction = 'ltr',
    vimBindings = false,
    loop = true,
    store: externalStore,
  } = props

  // Create or use external menu store - Menu.Root will handle controlled prop
  const menuStore = MenuStore.useStore(externalStore, {
    open: openProp ?? defaultOpen,
    disabled,
    direction,
    vimBindings,
    loop,
  })

  // Get reactive open state from store
  const open = menuStore.useState('open')

  // Handle open change from Popover - sync to store and call user callback
  const handlePopoverOpenChange = React.useCallback(
    (nextOpen: boolean, eventDetails: Popover.Root.ChangeEventDetails) => {
      // Only update store if uncontrolled (Menu.Root handles controlled case)
      if (openProp === undefined) {
        menuStore.setOpen(nextOpen)
      }
      onOpenChange?.(nextOpen, eventDetails)
    },
    [menuStore, openProp, onOpenChange],
  )

  // Handle open change from Menu.Root (keyboard, etc.)
  const handleMenuOpenChange = React.useCallback((nextOpen: boolean) => {
    // Popover will sync via controlled `open` prop
    // Note: We don't call onOpenChange here because Popover.Root will
    // trigger it via handlePopoverOpenChange when it sees the open state change
  }, [])

  const contextValue = React.useMemo<DropdownMenuRootContextValue>(
    () => ({ menuStore }),
    [menuStore],
  )

  return (
    <Popover.Root
      open={open}
      onOpenChange={handlePopoverOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
      modal={modal}
      actionsRef={actionsRef}
    >
      <Menu.Root
        open={openProp}
        defaultOpen={defaultOpen}
        onOpenChange={handleMenuOpenChange}
        disabled={disabled}
        direction={direction}
        vimBindings={vimBindings}
        loop={loop}
        store={menuStore}
      >
        <DropdownMenuRootContext.Provider value={contextValue}>
          {children}
        </DropdownMenuRootContext.Provider>
      </Menu.Root>
    </Popover.Root>
  )
}

DropdownMenuRoot.displayName = 'DropdownMenuRoot'
