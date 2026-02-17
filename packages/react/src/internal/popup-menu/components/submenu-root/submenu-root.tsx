'use client'

import { Popover, type PopoverRootProps } from '@base-ui/react/popover'
import { useStableCallback } from '@base-ui/utils/useStableCallback'
import * as React from 'react'
import {
  ListboxContextProvider,
  ListboxStore,
  useMaybeListboxContext,
  useSurfaceContext,
  type VirtualItem,
} from '../../../listbox/index.js'
import { useOpenChain } from '../../contexts/open-chain-context.js'
import {
  PopupMenuContext,
  useMaybePopupMenuContext,
} from '../../contexts/popup-menu-context.js'
import { SubmenuContext } from '../../contexts/submenu-context.js'
import type { PopupMenuRootActions } from '../../hooks/use-popup-menu-root.js'

export interface PopupMenuSubmenuRootProps
  extends Omit<
    PopoverRootProps,
    'open' | 'onOpenChange' | 'defaultOpen' | 'actionsRef'
  > {
  /**
   * Whether the submenu is open.
   * Use for controlled mode.
   */
  open?: boolean

  /**
   * Callback when the open state changes.
   * The second parameter contains event details including the reason for the change.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: Popover.Root.ChangeEventDetails,
  ) => void

  /**
   * Whether the submenu is initially open.
   * Use for uncontrolled mode.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Whether pressing Escape in this submenu closes the entire menu from the root.
   * When true (default), Escape closes the entire menu tree.
   * When false, Escape only closes this submenu and moves focus to the parent.
   * @default true
   */
  closeRootOnEsc?: boolean

  /**
   * Whether virtualization mode is enabled for this submenu.
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
   */
  onHighlightChange?: (id: string | null, index: number) => void

  /**
   * Event handler called after any open/close animations have completed.
   * When `clearSearchOnClose="after-exit"` is set on Surface, the search
   * will be cleared before this callback is invoked.
   */
  onOpenChangeComplete?: (open: boolean) => void

  /**
   * Whether this submenu should ignore user interaction.
   * Also inherits disabled state from its parent menu.
   * @default false
   */
  disabled?: boolean

  /**
   * A ref to imperative actions.
   * - `close`: closes the submenu imperatively.
   * - `unmount`: unmounts the popup imperatively (when keep-mounted mode is enabled).
   * - `setDisabled`: enables/disables the submenu imperatively.
   */
  actionsRef?: React.RefObject<PopupMenuSubmenuRoot.Actions | null>

  children: React.ReactNode
}

/**
 * Groups all parts of a submenu.
 * Manages open state and provides context to children.
 * Creates its own ListboxStore independent from the parent menu.
 * Doesn't render its own HTML element.
 */
export function PopupMenuSubmenuRoot(props: PopupMenuSubmenuRootProps) {
  const {
    open: openProp,
    onOpenChange,
    defaultOpen = false,
    closeRootOnEsc = true,
    virtualized = false,
    items: itemsProp,
    onHighlightChange,
    onOpenChangeComplete: onOpenChangeCompleteProp,
    disabled: disabledProp = false,
    actionsRef,
    children,
    ...rest
  } = props

  const parentListboxContext = useMaybeListboxContext()
  const parentPopupMenuContext = useMaybePopupMenuContext()
  const parentDepth = parentListboxContext?.depth ?? 0
  const parentCloseAll = parentListboxContext?.closeAll
  const parentRegisterSurface = parentListboxContext?.registerSurface

  // Get parent surface ID for keyboard navigation back
  const { surfaceId: parentSurfaceId } = useSurfaceContext()

  // Generate unique surface ID for this submenu
  const childSurfaceId = React.useId()

  // Ref for trigger element
  const triggerRef = React.useRef<HTMLElement | null>(null)
  // Ref for submenu content element (used for aim guard rect calculations)
  const contentRef = React.useRef<HTMLElement | null>(null)

  // Create the store instance for this submenu
  const store = ListboxStore.useStore(undefined, { open: defaultOpen })

  const [imperativeDisabled, setImperativeDisabled] = React.useState(false)
  const disabled =
    (parentPopupMenuContext?.disabled ?? false) ||
    disabledProp ||
    imperativeDisabled

  const setDisabled = React.useCallback((nextDisabled: boolean) => {
    setImperativeDisabled(nextDisabled)
  }, [])

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (newOpen && disabled) {
        return
      }
      store.setOpen(newOpen)
    },
    [store, disabled],
  )

  // Sync controlled open prop to store
  store.useControlledProp('open', openProp, defaultOpen)

  // Get open chain store
  const openChainStore = useOpenChain()

  // Get open state from store for Popover
  const open = store.useState('open')

  // Track this submenu in the open chain
  React.useEffect(() => {
    if (open) {
      openChainStore.open(childSurfaceId)
    } else {
      openChainStore.close(childSurfaceId)
    }
  }, [open, childSurfaceId, openChainStore])

  // Handle Popover's onOpenChange to update the store and call user's callback
  const handlePopoverOpenChange = React.useCallback(
    (newOpen: boolean, eventDetails: Popover.Root.ChangeEventDetails) => {
      // Call user's onOpenChange first so they can cancel
      onOpenChange?.(newOpen, eventDetails)

      // If the user cancelled, don't update the store
      if (eventDetails.isCanceled) {
        return
      }

      setOpen(newOpen)
    },
    [setOpen, onOpenChange],
  )

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
        store.context.onPopupCloseComplete?.()
      }
      // Call user's callback
      onOpenChangeCompleteProp?.(nextOpen)
    },
    [store, onOpenChangeCompleteProp],
  )

  // Close submenu when parent menu closes
  // We track parent open state to close the submenu when parent closes
  const [parentOpen, setParentOpen] = React.useState(true)

  React.useEffect(() => {
    if (!parentListboxContext) return

    const parentStore = parentListboxContext.store
    // Poll the parent store's open state
    const checkParentOpen = () => {
      const isOpen = parentStore.state.open
      setParentOpen(isOpen)
    }

    // Check immediately
    checkParentOpen()

    // Subscribe to state changes by observing the store
    // We use observe method which is called when state changes
    const unsubscribe = parentStore.observe('open', checkParentOpen)

    return unsubscribe
  }, [parentListboxContext])

  React.useEffect(() => {
    if (!parentOpen) {
      setOpen(false)
    }
  }, [parentOpen, setOpen])

  // Register this submenu with the root for closeAll tracking
  const depth = parentDepth + 1
  React.useEffect(() => {
    if (!parentRegisterSurface) return
    return parentRegisterSurface(depth, (newOpen) => setOpen(newOpen))
  }, [parentRegisterSurface, depth, setOpen])

  const popoverActionsRef = React.useRef<Popover.Root.Actions | null>(null)

  React.useImperativeHandle(
    actionsRef,
    () => ({
      close: () => {
        popoverActionsRef.current?.close()
      },
      unmount: () => {
        popoverActionsRef.current?.unmount()
      },
      setDisabled,
    }),
    [setDisabled],
  )

  // Submenu context value
  const submenuContextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      triggerRef,
      contentRef,
      parentSurfaceId,
      childSurfaceId,
      closeRootOnEsc,
    }),
    [open, setOpen, parentSurfaceId, childSurfaceId, closeRootOnEsc],
  )

  // Fallback registerSurface for edge cases (submenu without parent root)
  const fallbackRegisterSurface = React.useCallback(() => () => {}, [])

  // Memoize listbox wiring config for this submenu
  const virtualization = React.useMemo(() => {
    if (!virtualized && !onHighlightChange) {
      return undefined
    }

    return {
      virtualized,
      items: itemsProp ?? [],
      onHighlightChange,
    }
  }, [virtualized, itemsProp, onHighlightChange])

  // Listbox context value with incremented depth
  // Pass parent's closeAll and registerSurface through unchanged
  const listboxContextValue = React.useMemo(
    () => ({
      store,
      depth,
      closeAll: parentCloseAll ?? (() => store.setOpen(false)),
      registerSurface: parentRegisterSurface ?? fallbackRegisterSurface,
      virtualization,
    }),
    [
      store,
      depth,
      parentCloseAll,
      parentRegisterSurface,
      fallbackRegisterSurface,
      virtualization,
    ],
  )

  // PopupMenu context value with incremented depth
  // This is needed for PopupMenuPositioner to get the correct depth
  const popupMenuContextValue = React.useMemo(
    () => ({
      store,
      disabled,
      depth,
      closeAll: parentCloseAll ?? (() => setOpen(false)),
      registerSurface: parentRegisterSurface ?? fallbackRegisterSurface,
      virtualization,
      virtualAnchor: parentPopupMenuContext?.virtualAnchor,
      menuType: parentPopupMenuContext?.menuType ?? ('dropdown' as const),
      closeOnOutsidePress:
        parentPopupMenuContext?.closeOnOutsidePress ?? 'pointerdown',
      getQualifiedRowId: parentPopupMenuContext?.getQualifiedRowId,
    }),
    [
      store,
      disabled,
      depth,
      parentCloseAll,
      parentRegisterSurface,
      setOpen,
      fallbackRegisterSurface,
      virtualization,
      parentPopupMenuContext?.virtualAnchor,
      parentPopupMenuContext?.menuType,
      parentPopupMenuContext?.closeOnOutsidePress,
      parentPopupMenuContext?.getQualifiedRowId,
    ],
  )

  return (
    <SubmenuContext.Provider value={submenuContextValue}>
      <PopupMenuContext.Provider value={popupMenuContextValue}>
        <ListboxContextProvider.Provider value={listboxContextValue}>
          <Popover.Root
            {...rest}
            open={open}
            onOpenChange={handlePopoverOpenChange}
            onOpenChangeComplete={handleOpenChangeComplete}
            actionsRef={actionsRef ? popoverActionsRef : undefined}
          >
            {children}
          </Popover.Root>
        </ListboxContextProvider.Provider>
      </PopupMenuContext.Provider>
    </SubmenuContext.Provider>
  )
}

export namespace PopupMenuSubmenuRoot {
  export interface Props extends PopupMenuSubmenuRootProps {}
  export type ChangeEventDetails = Popover.Root.ChangeEventDetails
  export type Actions = PopupMenuRootActions
}
