'use client'

import { Popover, type PopoverRootProps } from '@base-ui/react/popover'
import { useCallback, useRef } from 'react'
import type { VirtualItem } from '../../internal/listbox/index.js'
import {
  PopupMenuProviders,
  type UsePopupMenuRootParams,
  usePopupMenuRoot,
} from '../../internal/popup-menu/index.js'
import type {
  DropdownMenuHighlightChangeEventDetails,
  DropdownMenuOpenChangeEventDetails,
} from '../events.js'

export interface DropdownMenuRootProps
  extends Omit<PopoverRootProps, 'open' | 'onOpenChange' | 'defaultOpen'> {
  /**
   * Whether the dropdown menu is open.
   * Use for controlled mode.
   */
  open?: boolean

  /**
   * Callback when the open state changes.
   * The second parameter contains event details including the reason for the change.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: DropdownMenuOpenChangeEventDetails,
  ) => void

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
   * The third parameter contains event details including the reason for the change.
   */
  onHighlightChange?: (
    id: string | null,
    index: number,
    eventDetails: DropdownMenuHighlightChangeEventDetails,
  ) => void

  /**
   * When to close the menu on outside interactions (clicking outside or clicking the trigger when open).
   * - `'pointerdown'`: Close immediately when pointer is pressed outside (default)
   * - `'click'`: Close when a full click (pointerdown + pointerup) occurs outside
   * @default 'pointerdown'
   */
  closeOnOutsidePress?: 'click' | 'pointerdown'

  /**
   * Event handler called after any open/close animations have completed.
   * When `clearSearchOnClose="after-exit"` is set on Surface, the search
   * will be cleared before this callback is invoked.
   */
  onOpenChangeComplete?: (open: boolean) => void

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
    closeOnOutsidePress = 'pointerdown',
    onOpenChangeComplete: onOpenChangeCompleteProp,
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
    // Cast to generic type - component handles type safety via narrowed types
    onOpenChange:
      onOpenChange as unknown as UsePopupMenuRootParams['onOpenChange'],
    defaultOpen,
    virtualized,
    items: itemsProp,
    onHighlightChange:
      onHighlightChange as unknown as UsePopupMenuRootParams['onHighlightChange'],
    closeOnOutsidePress,
  })

  // Sync controlled open prop to store
  store.useControlledProp('open', openProp, defaultOpen)

  // Get open state from store for Popover
  const open = store.useState('open')

  // Handle animation complete - clear search and hide input if clearSearchOnClose is 'after-exit'
  const handleOpenChangeComplete = useCallback(
    (nextOpen: boolean) => {
      // Clear search and hide input after exit animation completes
      if (!nextOpen && store.context.clearSearchOnClose === 'after-exit') {
        store.clearSearch()
        store.setInputActive(false)
      }
      // Call user's callback
      onOpenChangeCompleteProp?.(nextOpen)
    },
    [store, onOpenChangeCompleteProp],
  )

  // Wrapper to adapt Popover's event details to our handleOpenChange
  const handlePopoverOpenChange = useCallback(
    (nextOpen: boolean, popoverDetails: Popover.Root.ChangeEventDetails) => {
      // Forward to our internal handler with the reason and event
      handleOpenChange(
        nextOpen,
        popoverDetails.reason as DropdownMenuOpenChangeEventDetails['reason'],
        popoverDetails.event,
      )
    },
    [handleOpenChange],
  )

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
      closeOnOutsidePress={closeOnOutsidePress}
    >
      <Popover.Root
        {...rest}
        open={open}
        onOpenChange={handlePopoverOpenChange}
        onOpenChangeComplete={handleOpenChangeComplete}
        modal={modal}
      >
        {children}
      </Popover.Root>
    </PopupMenuProviders>
  )
}

export namespace DropdownMenuRoot {
  export interface Props extends DropdownMenuRootProps {}
  export type OpenChangeEventDetails = DropdownMenuOpenChangeEventDetails
  export type HighlightChangeEventDetails =
    DropdownMenuHighlightChangeEventDetails
  export type Actions = Popover.Root.Actions
}
