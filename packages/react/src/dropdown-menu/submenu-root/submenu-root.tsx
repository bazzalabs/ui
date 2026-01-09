'use client'

import { Popover, type PopoverRootProps } from '@base-ui/react/popover'
import { useStableCallback } from '@base-ui/utils/useStableCallback'
import * as React from 'react'
import { RootContext, useMaybeRootContext } from '../contexts/root-context.js'
import { SubmenuContext } from '../contexts/submenu-context.js'
import { DropdownMenuStore } from '../store/DropdownMenuStore.js'

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
    children,
    ...rest
  } = props

  const parentRootContext = useMaybeRootContext()
  const parentDepth = parentRootContext?.depth ?? 0

  // Ref for trigger element
  const triggerRef = React.useRef<HTMLElement | null>(null)

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

  // Get open state from store for Popover
  const open = store.useState('open')

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

  // Submenu context value
  const submenuContextValue = React.useMemo(
    () => ({
      open,
      setOpen: (newOpen: boolean) => store.setOpen(newOpen),
      triggerRef,
    }),
    [open, store],
  )

  // Root context value with incremented depth
  const rootContextValue = React.useMemo(
    () => ({
      store,
      depth: parentDepth + 1,
    }),
    [store, parentDepth],
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
