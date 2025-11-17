import { Popover } from '@base-ui-components/react/popover'
import type { MenuDef, MenuNodeDefaults } from '@bazza-ui/menu'
import {
  type InteractionGuardOptions,
  RootProvider,
} from '@bazza-ui/popup-menu'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import { RootContextProvider } from '../contexts/root-context.js'

export interface ContextMenuRootProps<T = unknown>
  extends Partial<InteractionGuardOptions> {
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
  /** Base defaults (factory + instance) shared across the entire menu */
  defaults?: Partial<MenuNodeDefaults<T>>
}

/**
 * ContextMenuRoot - Root component that manages state and provides context
 */
export function ContextMenuRoot<T = unknown>({
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
}: ContextMenuRootProps<T>) {
  const [open, setOpen] = useControllableState({
    prop: controlledOpen,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  })

  const [anchorPoint, setAnchorPoint] = React.useState<{
    x: number
    y: number
  } | null>(null)

  const scopeId = React.useId()
  const clearAnchorTimeoutRef = React.useRef<number | null>(null)

  const closeAllSurfaces = React.useCallback(() => {
    setOpen(false)
    // Clear any pending timeout
    if (clearAnchorTimeoutRef.current !== null) {
      clearTimeout(clearAnchorTimeoutRef.current)
    }
    // Delay clearing anchor point to allow exit animation to complete
    clearAnchorTimeoutRef.current = setTimeout(() => {
      setAnchorPoint(null)
      clearAnchorTimeoutRef.current = null
    }, 200) as any
  }, [setOpen])

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (clearAnchorTimeoutRef.current !== null) {
        clearTimeout(clearAnchorTimeoutRef.current)
      }
    }
  }, [])

  const rootValue = React.useMemo(
    () => ({
      scopeId,
      open,
      onOpenChange: setOpen,
      closeAllSurfaces,
      anchorPoint,
      setAnchorPoint,
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
      anchorPoint,
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
      <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
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
