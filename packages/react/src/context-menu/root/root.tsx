'use client'

import { Popover } from '@base-ui/react/popover'
import * as React from 'react'
import type { VirtualItem } from '../../internal/listbox/index.js'
import type { GetQualifiedRowIdFn } from '../../internal/popup-menu/deep-search/types.js'
import {
  PopupMenuProviders,
  type UsePopupMenuRootParams,
  usePopupMenuRoot,
  type VirtualAnchor,
} from '../../internal/popup-menu/index.js'
import type {
  ContextMenuHighlightChangeEventDetails,
  ContextMenuOpenChangeEventDetails,
} from '../events.js'

export interface ContextMenuRootProps {
  /**
   * Whether the context menu is open.
   * Use for controlled mode.
   */
  open?: boolean

  /**
   * Callback when the open state changes.
   * The second parameter contains event details including the reason for the change.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: ContextMenuOpenChangeEventDetails,
  ) => void

  /**
   * Whether the context menu is initially open.
   * Use for uncontrolled mode.
   * @default false
   */
  defaultOpen?: boolean

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
    eventDetails: ContextMenuHighlightChangeEventDetails,
  ) => void

  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean

  /**
   * Determines if the context menu enters a modal state when open.
   *
   * - `true`: user interaction is limited to the menu: document page scroll
   *   is locked, and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   *
   * @default true
   */
  modal?: boolean

  /**
   * When to close the menu on outside interactions.
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

  /**
   * Function to generate qualified unique IDs for rows.
   * Defined once at the root level and applied to all surfaces (root and submenus).
   *
   * Default behavior:
   * - If node.id is provided, use it as-is (treat as globally unique)
   * - Otherwise, qualify with breadcrumbs + slugified value when deep searching
   */
  getQualifiedRowId?: GetQualifiedRowIdFn

  children: React.ReactNode
}

/**
 * Internal context for ContextMenu-specific state.
 * Used by Trigger to set the virtual anchor position.
 */
interface ContextMenuInternalContextValue {
  /** Set the virtual anchor position (called by Trigger on right-click) */
  setAnchorPosition: (x: number, y: number, isTouchEvent?: boolean) => void
  /** Open the menu */
  openMenu: () => void
  /** Close the menu */
  closeMenu: () => void
  /** Whether the menu is disabled */
  disabled: boolean
  /** Whether the menu is open */
  open: boolean
}

const ContextMenuInternalContext =
  React.createContext<ContextMenuInternalContextValue | null>(null)

export function useContextMenuInternal(): ContextMenuInternalContextValue {
  const context = React.useContext(ContextMenuInternalContext)
  if (!context) {
    throw new Error(
      'ContextMenu components must be used within a ContextMenu.Root',
    )
  }
  return context
}

/**
 * Creates a virtual anchor at a specific point for positioning.
 */
function createVirtualAnchor(
  x: number,
  y: number,
  isTouchEvent = false,
): VirtualAnchor {
  // Touch events use a larger anchor for better UX
  const size = isTouchEvent ? 10 : 0
  return {
    getBoundingClientRect() {
      return DOMRect.fromRect({
        width: size,
        height: size,
        x,
        y,
      })
    },
  }
}

/**
 * Groups all parts of the context menu.
 * Manages open state and provides context to children.
 * Doesn't render its own HTML element.
 */
export function ContextMenuRoot(props: ContextMenuRoot.Props) {
  const {
    open: openProp,
    onOpenChange,
    defaultOpen = false,
    virtualized = false,
    items: itemsProp,
    onHighlightChange,
    disabled = false,
    modal = true,
    closeOnOutsidePress = 'pointerdown',
    onOpenChangeComplete: onOpenChangeCompleteProp,
    getQualifiedRowId,
    children,
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

  // Get open state from store
  const open = store.useState('open')

  // Virtual anchor state (position where menu appears)
  const [virtualAnchor, setVirtualAnchor] = React.useState<VirtualAnchor>(() =>
    createVirtualAnchor(0, 0),
  )

  // Set anchor position (called by Trigger on right-click/long-press)
  const setAnchorPosition = React.useCallback(
    (x: number, y: number, isTouchEvent = false) => {
      setVirtualAnchor(createVirtualAnchor(x, y, isTouchEvent))
    },
    [],
  )

  // Open the menu
  const openMenu = React.useCallback(() => {
    if (disabled) return
    store.setOpen(true)
  }, [store, disabled])

  // Close the menu
  const closeMenu = React.useCallback(() => {
    handleOpenChange(false)
  }, [handleOpenChange])

  // Handle animation complete - clear search and hide input if clearSearchOnClose is 'after-exit'
  const handleOpenChangeComplete = React.useCallback(
    (nextOpen: boolean) => {
      // Clear search and hide input after exit animation completes
      if (!nextOpen && store.context.clearSearchOnClose === 'after-exit') {
        store.clearSearch()
        store.setInputActive(false)
      }
      // Reset row width measurements after close animation completes
      if (!nextOpen) {
        store.context.onCloseComplete?.()
      }
      // Call user's callback
      onOpenChangeCompleteProp?.(nextOpen)
    },
    [store, onOpenChangeCompleteProp],
  )

  // Wrapper to adapt Popover's event details to our handleOpenChange
  const handlePopoverOpenChange = React.useCallback(
    (nextOpen: boolean, popoverDetails: Popover.Root.ChangeEventDetails) => {
      // Forward to our internal handler with the reason and event
      handleOpenChange(
        nextOpen,
        popoverDetails.reason as ContextMenuOpenChangeEventDetails['reason'],
        popoverDetails.event,
      )
    },
    [handleOpenChange],
  )

  // Internal context for Trigger
  const internalContextValue: ContextMenuInternalContextValue = React.useMemo(
    () => ({
      setAnchorPosition,
      openMenu,
      closeMenu,
      disabled,
      open,
    }),
    [setAnchorPosition, openMenu, closeMenu, disabled, open],
  )

  return (
    <ContextMenuInternalContext.Provider value={internalContextValue}>
      <PopupMenuProviders
        store={store}
        focusOwnerStore={focusOwnerStore}
        openChainStore={openChainStore}
        depth={0}
        closeAll={closeAll}
        registerSurface={registerSurface}
        virtualization={virtualization}
        virtualAnchor={virtualAnchor}
        menuType="context"
        closeOnOutsidePress={closeOnOutsidePress}
        componentName="context-menu"
        getQualifiedRowId={getQualifiedRowId}
      >
        <Popover.Root
          open={open}
          onOpenChange={handlePopoverOpenChange}
          onOpenChangeComplete={handleOpenChangeComplete}
          modal={modal}
        >
          {children}
        </Popover.Root>
      </PopupMenuProviders>
    </ContextMenuInternalContext.Provider>
  )
}

export namespace ContextMenuRoot {
  export interface Props extends ContextMenuRootProps {}
  export type OpenChangeEventDetails = ContextMenuOpenChangeEventDetails
  export type HighlightChangeEventDetails =
    ContextMenuHighlightChangeEventDetails
}
