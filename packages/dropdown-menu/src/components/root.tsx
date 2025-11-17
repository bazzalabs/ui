import { Popover } from '@base-ui-components/react/popover'
import type { MenuDef } from '@bazza-ui/menu'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import { RootContextProvider } from '../contexts/root-context.js'

export interface DropdownMenuRootProps<T = unknown> {
  /** Menu definition */
  menu: MenuDef<T>
  /** Children (typically Trigger and Content) */
  children: React.ReactNode
  /** Callback when menu opens/closes */
  onOpenChange?: (open: boolean) => void
  /** Whether the menu is open (controlled) */
  open?: boolean
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean
  /** Whether clicking outside closes the menu */
  modal?: boolean
}

/**
 * DropdownMenuRoot - Root component that manages state and provides context
 */
export function DropdownMenuRoot<T = unknown>({
  menu,
  children,
  onOpenChange,
  open: controlledOpen,
  defaultOpen = false,
  modal = true,
}: DropdownMenuRootProps<T>) {
  const [open, setOpen] = useControllableState({
    prop: controlledOpen,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  })

  const triggerRef = React.useRef<HTMLDivElement>(null)
  const scopeId = React.useId()

  const closeAllSurfaces = React.useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const rootValue = React.useMemo(
    () => ({
      scopeId,
      open,
      onOpenChange: setOpen,
      closeAllSurfaces,
      triggerRef,
    }),
    [scopeId, open, setOpen, closeAllSurfaces],
  )

  return (
    <RootContextProvider value={rootValue}>
      <Popover.Root open={open} onOpenChange={setOpen}>
        {children}
      </Popover.Root>
    </RootContextProvider>
  )
}
