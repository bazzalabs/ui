import { Popover } from '@base-ui-components/react/popover'
import type { ActivationCause } from '@bazza-ui/menu'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import { usePopupMenuActions } from '../../store/index.js'
import type { PopupSubmenuDef } from '../../types.js'
import type { SubContextValue } from '../submenu/submenu-context.js'
import { SubCtx, useSub } from '../submenu/submenu-context.js'
import { useSurface } from '../surface/surface-provider.js'

export interface PopupMenuSubmenuProps<T> {
  def: PopupSubmenuDef<T>
  children: React.ReactNode
}

/**
 * PopupMenuSubmenu wraps submenu content and manages state, refs, and context.
 * Simpler than action-menu version - only supports popover mode (no drawer).
 */
export function PopupMenuSubmenu<T = unknown>({
  def,
  children,
}: PopupMenuSubmenuProps<T>) {
  const [open, setOpen] = useControllableState({
    prop: def.open?.value,
    defaultProp: def.open?.defaultValue ?? false,
    onChange: def.open?.onValueChange,
  })

  const triggerRef = React.useRef<HTMLDivElement | HTMLButtonElement | null>(
    null,
  )
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  const { surfaceId: parentSurfaceIdFromCtx } = useSurface()
  const storeActions = usePopupMenuActions()
  const parentSubCtx = useSub()

  // Determine parent surface ID: if we're inside another submenu, use its childSurfaceId,
  // otherwise we're at the root level
  const parentSurfaceId = React.useMemo(
    () => parentSubCtx?.childSurfaceId ?? parentSurfaceIdFromCtx,
    [parentSubCtx, parentSurfaceIdFromCtx],
  )

  const [triggerItemId, setTriggerItemId] = React.useState<string | null>(null)
  const childSurfaceId = React.useId()

  const pendingOpenModalityRef = React.useRef<'keyboard' | 'pointer' | null>(
    null,
  )
  const intentZoneActiveRef = React.useRef<boolean>(false)

  const onOpenToggle = React.useCallback(() => {
    setOpen(!open)
  }, [setOpen, open])

  // Create setActiveId callback that uses global store
  const parentSetActiveId = React.useCallback(
    (id: string | null, cause?: ActivationCause) => {
      storeActions.setSurfaceActiveId(parentSurfaceId, id, cause)
    },
    [storeActions, parentSurfaceId],
  )

  const value: SubContextValue<T> = React.useMemo(
    () => ({
      open,
      onOpenChange: setOpen,
      onOpenToggle,
      triggerRef,
      contentRef,
      def,
      parentSurfaceId,
      triggerItemId,
      setTriggerItemId,
      parentSetActiveId,
      childSurfaceId,
      pendingOpenModalityRef,
      intentZoneActiveRef,
      parentSub: parentSubCtx,
    }),
    [
      open,
      setOpen,
      onOpenToggle,
      def,
      parentSurfaceId,
      triggerItemId,
      parentSetActiveId,
      childSurfaceId,
      parentSubCtx,
    ],
  )

  return (
    <SubCtx.Provider value={value}>
      <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
        {children}
      </Popover.Root>
    </SubCtx.Provider>
  )
}
