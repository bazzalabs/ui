'use client'

import { Popover, type PopoverRootProps } from '@base-ui/react/popover'
import { useStableCallback } from '@base-ui/utils/useStableCallback'
import * as React from 'react'
import { AimGuardProvider } from '../contexts/aim-guard-context.js'
import { RootContext } from '../contexts/root-context.js'
import { DropdownMenuStore } from '../store/DropdownMenuStore.js'

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
    children,
    ...rest
  } = props

  // Create stable callback for onOpenChange
  const handleOpenChange = useStableCallback((newOpen: boolean) => {
    onOpenChange?.(newOpen)
  })

  // Create the store instance
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

  const contextValue = React.useMemo(
    () => ({
      store,
      depth: 0,
    }),
    [store],
  )

  return (
    <RootContext.Provider value={contextValue}>
      <AimGuardProvider>
        <Popover.Root
          {...rest}
          open={open}
          onOpenChange={handlePopoverOpenChange}
        >
          {children}
        </Popover.Root>
      </AimGuardProvider>
    </RootContext.Provider>
  )
}

export namespace DropdownMenuRoot {
  export interface Props extends DropdownMenuRootProps {}
  export type ChangeEventDetails = Popover.Root.ChangeEventDetails
  export type Actions = Popover.Root.Actions
}
