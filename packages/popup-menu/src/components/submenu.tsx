import { Popover } from '@base-ui-components/react/popover'
import type { SubmenuDef } from '@bazza-ui/menu'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import { useFocusOwner } from '../contexts/focus-owner-context.js'
import type { SubContextValue } from '../contexts/submenu-context.js'
import { SubCtx, useSubCtx } from '../contexts/submenu-context.js'
import { findWidgetsWithinSurface } from '../utils/dom.js'
import { useSurface } from './surface-provider.js'

export interface PopupMenuSubmenuProps {
  def: SubmenuDef
  children: React.ReactNode
}

/**
 * PopupMenuSubmenu wraps submenu content and manages state, refs, and context.
 * Simpler than action-menu version - only supports popover mode (no drawer).
 */
export function PopupMenuSubmenu({ def, children }: PopupMenuSubmenuProps) {
  const [open, setOpen] = useControllableState({
    prop: def.open?.value,
    defaultProp: def.open?.defaultValue ?? false,
    onChange: def.open?.onValueChange,
  })

  const triggerRef = React.useRef<HTMLDivElement | HTMLButtonElement | null>(
    null,
  )
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  const parentSurface = useSurface()
  const parentStore = parentSurface.store
  const parentSubCtx = useSubCtx()

  // Determine parent surface ID: if we're inside another submenu, use its childSurfaceId,
  // otherwise we're at the root level
  const parentSurfaceId = React.useMemo(
    () => parentSubCtx?.childSurfaceId ?? 'root',
    [parentSubCtx],
  )

  const [triggerItemId, setTriggerItemId] = React.useState<string | null>(null)
  const childSurfaceId = React.useId()

  const pendingOpenModalityRef = React.useRef<'keyboard' | 'pointer' | null>(
    null,
  )
  const intentZoneActiveRef = React.useRef<boolean>(false)

  const { setOwnerId } = useFocusOwner()

  const onOpenToggle = React.useCallback(() => {
    setOpen(!open)
  }, [setOpen, open])

  const value: SubContextValue = React.useMemo(
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
      parentSetActiveId: parentStore.setActiveId,
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
      parentStore.setActiveId,
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
