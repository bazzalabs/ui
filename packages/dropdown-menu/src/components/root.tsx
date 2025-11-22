import { Popover } from '@base-ui-components/react/popover'
import type { MenuNodeDefaults } from '@bazza-ui/menu'
import {
  type InteractionGuardOptions,
  RootProvider,
} from '@bazza-ui/popup-menu'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import { RootContextProvider } from '../contexts/root-context.js'
import type { DropdownMenuDef } from '../types.js'

export interface DropdownMenuRootProps<T = unknown>
  extends Partial<InteractionGuardOptions> {
  /** Menu definition */
  menu: DropdownMenuDef<T>
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
  /** Base defaults (factory + instance) shared across the entire menu */
  defaults?: Partial<MenuNodeDefaults<T>>
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
  defaults,
  // InteractionGuard options
  scopeAttr,
  disableOutsidePointerEvents,
  onEscapeKeyDown,
  onPointerDownOutside,
  onFocusOutside,
  onInteractOutside,
  onDismiss,
  surfaceSelector,
  branchAttr,
}: DropdownMenuRootProps<T>) {
  const [open, setOpen] = useControllableState({
    prop: controlledOpen,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  })

  const triggerRef = React.useRef<HTMLElement>(null)
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
      // InteractionGuard options
      interactionGuardOptions: {
        scopeAttr,
        disableOutsidePointerEvents,
        onEscapeKeyDown,
        onPointerDownOutside,
        onFocusOutside,
        onInteractOutside,
        onDismiss,
        surfaceSelector,
        branchAttr,
      },
    }),
    [
      scopeId,
      open,
      setOpen,
      closeAllSurfaces,
      scopeAttr,
      disableOutsidePointerEvents,
      onEscapeKeyDown,
      onPointerDownOutside,
      onFocusOutside,
      onInteractOutside,
      onDismiss,
      surfaceSelector,
      branchAttr,
    ],
  )

  return (
    <RootContextProvider value={rootValue}>
      <Popover.Root open={open} onOpenChange={setOpen} modal={modal}>
        <RootProvider
          scopeId={scopeId}
          onClose={closeAllSurfaces}
          interactionGuardOptions={rootValue.interactionGuardOptions}
          defaults={defaults as any}
        >
          {children}
        </RootProvider>
      </Popover.Root>
    </RootContextProvider>
  )
}
