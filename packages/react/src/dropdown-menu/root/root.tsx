'use client'

import { Popover, type PopoverRootProps } from '@base-ui/react/popover'
import type * as React from 'react'
import type { VirtualItem } from '../../internal/listbox/index.js'
import {
  PopupMenuProviders,
  usePopupMenuRoot,
} from '../../internal/popup-menu/index.js'

export interface DropdownMenuRootProps
  extends Omit<PopoverRootProps, 'open' | 'onOpenChange' | 'defaultOpen'> {
  /**
   * Whether the dropdown menu is open.
   * Use for controlled mode.
   */
  open?: boolean

  /**
   * Callback when the open state changes.
   */
  onOpenChange?: (open: boolean) => void

  /**
   * Whether the dropdown menu is initially open.
   * Use for uncontrolled mode.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Determines if the dropdown menu enters a modal state when open.
   *
   * - `true`: user interaction is limited to the dropdown menu: document page scroll
   *   is locked, and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * - `'trap-focus'`: focus is trapped inside the dropdown menu, but document page
   *   scroll is not locked and pointer interactions outside of it remain enabled.
   *
   * @default true
   */
  modal?: boolean | 'trap-focus'

  /**
   * Whether virtualization mode is enabled.
   * When true, items should provide an explicit `index` prop and
   * the `items` prop should be provided for navigation to work correctly.
   * @default false
   */
  virtualized?: boolean

  /**
   * Pre-registered items for virtualization.
   * When provided with `virtualized={true}`, this allows navigation to work
   * for items that aren't currently mounted in the DOM.
   */
  items?: VirtualItem[]

  /**
   * Callback when the highlighted item changes.
   * Useful for synchronizing with a virtualizer (e.g., scrollToIndex).
   * Only called when `virtualized={true}`.
   */
  onHighlightChange?: (id: string | null, index: number) => void

  children: React.ReactNode
}

/**
 * Groups all parts of the dropdown menu.
 * Manages open state and provides context to children.
 * Doesn't render its own HTML element.
 */
export function DropdownMenuRoot(props: DropdownMenuRootProps) {
  const {
    open: openProp,
    onOpenChange,
    defaultOpen = false,
    modal = true,
    virtualized = false,
    items: itemsProp,
    onHighlightChange,
    children,
    ...rest
  } = props

  // Use shared hook to create stores and utilities
  const {
    store,
    focusOwnerStore,
    openChainStore,
    registerSurface,
    closeAll,
    virtualization,
    handleOpenChange,
  } = usePopupMenuRoot({
    onOpenChange,
    defaultOpen,
    virtualized,
    items: itemsProp,
    onHighlightChange,
  })

  // Sync controlled open prop to store
  store.useControlledProp('open', openProp, defaultOpen)

  // Get open state from store for Popover
  const open = store.useState('open')

  return (
    <PopupMenuProviders
      store={store}
      focusOwnerStore={focusOwnerStore}
      openChainStore={openChainStore}
      depth={0}
      closeAll={closeAll}
      registerSurface={registerSurface}
      virtualization={virtualization}
      menuType="dropdown"
    >
      <Popover.Root
        {...rest}
        open={open}
        onOpenChange={handleOpenChange}
        modal={modal}
      >
        {children}
      </Popover.Root>
    </PopupMenuProviders>
  )
}

export namespace DropdownMenuRoot {
  export interface Props extends DropdownMenuRootProps {}
  export type ChangeEventDetails = Popover.Root.ChangeEventDetails
  export type Actions = Popover.Root.Actions
}
