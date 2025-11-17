import { Popover } from '@base-ui-components/react/popover'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import type { SubmenuDef } from '@bazza-ui/menu'
import * as React from 'react'
import { SubCtx } from '../contexts/submenu-context.js'
import { useFocusOwner } from '../contexts/focus-owner-context.js'
import { useSubCtx } from '../contexts/submenu-context.js'
import { useSurface } from './surface-provider.js'
import type { SubContextValue } from '../contexts/submenu-context.js'

/**
 * Find input and list widgets within a surface element.
 */
function findWidgetsWithinSurface(surfaceEl: HTMLElement | null) {
  if (!surfaceEl) return { input: null, list: null }
  const input = surfaceEl.querySelector<HTMLInputElement>(
    '[data-action-menu-input]',
  )
  const list = surfaceEl.querySelector<HTMLElement>('[data-action-menu-list]')
  return { input, list }
}

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
  const parentSurfaceId = React.useId() // Generate a surface ID for parent

  const [triggerItemId, setTriggerItemId] = React.useState<string | null>(null)
  const childSurfaceId = React.useId()

  const pendingOpenModalityRef = React.useRef<'keyboard' | 'pointer' | null>(
    null,
  )
  const intentZoneActiveRef = React.useRef<boolean>(false)

  const { setOwnerId } = useFocusOwner()
  const parentSubCtx = useSubCtx()

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
