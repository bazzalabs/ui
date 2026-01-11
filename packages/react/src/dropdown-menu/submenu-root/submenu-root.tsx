'use client'

import { Popover, type PopoverRootProps } from '@base-ui/react/popover'
import { useStableCallback } from '@base-ui/utils/useStableCallback'
import * as React from 'react'
import { useOpenChain } from '../contexts/open-chain-context.js'
import { RootContext, useMaybeRootContext } from '../contexts/root-context.js'
import { SubmenuContext } from '../contexts/submenu-context.js'
import { useSurfaceContext } from '../contexts/surface-context.js'
import {
  DropdownMenuStore,
  type VirtualItem,
} from '../store/DropdownMenuStore.js'

export interface DropdownMenuSubmenuRootProps
  extends Omit<PopoverRootProps, 'open' | 'onOpenChange' | 'defaultOpen'> {
  /**
   * Whether the submenu is open.
   * Use for controlled mode.
   */
  open?: boolean

  /**
   * Callback when the open state changes.
   */
  onOpenChange?: (open: boolean) => void

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
   * Only called when `virtualized={true}`.
   */
  onHighlightChange?: (id: string | null, index: number) => void

  children: React.ReactNode
}

/**
 * Groups all parts of a submenu.
 * Manages open state and provides context to children.
 * Creates its own DropdownMenuStore independent from the parent menu.
 * Doesn't render its own HTML element.
 */
export function DropdownMenuSubmenuRoot(props: DropdownMenuSubmenuRootProps) {
  const {
    open: openProp,
    onOpenChange,
    defaultOpen = false,
    closeRootOnEsc = true,
    virtualized = false,
    items: itemsProp,
    onHighlightChange,
    children,
    ...rest
  } = props

  const parentRootContext = useMaybeRootContext()
  const parentDepth = parentRootContext?.depth ?? 0
  const parentCloseAll = parentRootContext?.closeAll
  const parentRegisterSurface = parentRootContext?.registerSurface

  // Get parent surface ID for keyboard navigation back
  const { surfaceId: parentSurfaceId } = useSurfaceContext()

  // Generate unique surface ID for this submenu
  const childSurfaceId = React.useId()

  // Ref for trigger element
  const triggerRef = React.useRef<HTMLElement | null>(null)
  // Ref for submenu content element (used for aim guard rect calculations)
  const contentRef = React.useRef<HTMLElement | null>(null)

  // Create stable callback for onOpenChange
  const handleOpenChange = useStableCallback((newOpen: boolean) => {
    onOpenChange?.(newOpen)
  })

  // Create the store instance for this submenu
  const store = DropdownMenuStore.useStore(
    undefined,
    { open: defaultOpen },
    {
      onOpenChange: handleOpenChange,
    },
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

  // Handle Popover's onOpenChange to update the store
  const handlePopoverOpenChange = React.useCallback(
    (newOpen: boolean) => {
      store.setOpen(newOpen)
    },
    [store],
  )

  // Close submenu when parent menu closes
  // We track parent open state to close the submenu when parent closes
  const [parentOpen, setParentOpen] = React.useState(true)

  React.useEffect(() => {
    if (!parentRootContext) return

    const parentStore = parentRootContext.store
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
  }, [parentRootContext])

  React.useEffect(() => {
    if (!parentOpen) {
      store.setOpen(false)
    }
  }, [parentOpen, store])

  // Register this submenu with the root for closeAll tracking
  const depth = parentDepth + 1
  React.useEffect(() => {
    if (!parentRegisterSurface) return
    return parentRegisterSurface(depth, (newOpen) => store.setOpen(newOpen))
  }, [parentRegisterSurface, depth, store])

  // Submenu context value
  const submenuContextValue = React.useMemo(
    () => ({
      open,
      setOpen: (newOpen: boolean) => store.setOpen(newOpen),
      triggerRef,
      contentRef,
      parentSurfaceId,
      childSurfaceId,
      closeRootOnEsc,
    }),
    [open, store, parentSurfaceId, childSurfaceId, closeRootOnEsc],
  )

  // Fallback registerSurface for edge cases (submenu without parent root)
  const fallbackRegisterSurface = React.useCallback(() => () => {}, [])

  // Memoize virtualization config for this submenu
  const virtualization = React.useMemo(() => {
    if (!virtualized) return undefined
    return {
      virtualized: true as const,
      items: itemsProp ?? [],
      onHighlightChange,
    }
  }, [virtualized, itemsProp, onHighlightChange])

  // Root context value with incremented depth
  // Pass parent's closeAll and registerSurface through unchanged
  const rootContextValue = React.useMemo(
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

  return (
    <SubmenuContext.Provider value={submenuContextValue}>
      <RootContext.Provider value={rootContextValue}>
        <Popover.Root
          {...rest}
          open={open}
          onOpenChange={handlePopoverOpenChange}
        >
          {children}
        </Popover.Root>
      </RootContext.Provider>
    </SubmenuContext.Provider>
  )
}

export namespace DropdownMenuSubmenuRoot {
  export interface Props extends DropdownMenuSubmenuRootProps {}
  export type ChangeEventDetails = Popover.Root.ChangeEventDetails
  export type Actions = Popover.Root.Actions
}
