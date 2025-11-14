import { Popover } from '@base-ui-components/react/popover'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import { Drawer } from 'vaul'
import {
  SubCtx,
  useDisplayMode,
  useFocusOwner,
  useSubCtx,
  useSurface,
  useSurfaceId,
} from '../contexts/index.js'
import { findWidgetsWithinSurface } from '../lib/dom-utils.js'
import type { SubContextValue, SubmenuDef } from '../types.js'

export function Sub({
  def,
  children,
}: {
  def: SubmenuDef
  children: React.ReactNode
}) {
  const [open, setOpen] = useControllableState({
    prop: def.open?.value,
    defaultProp: def.open?.defaultValue ?? false,
    onChange: def.open?.onValueChange,
  })
  const triggerRef = React.useRef<HTMLDivElement | HTMLButtonElement | null>(
    null,
  )
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const parentStore = useSurface()
  const parentSurfaceId = useSurfaceId() || 'root'
  const [triggerItemId, setTriggerItemId] = React.useState<string | null>(null)
  const childSurfaceId = React.useId()
  const pendingOpenModalityRef = React.useRef<'keyboard' | 'pointer' | null>(
    null,
  )
  const intentZoneActiveRef = React.useRef<boolean>(false)
  const { setOwnerId } = useFocusOwner()
  const mode = useDisplayMode()
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

  if (mode === 'drawer') {
    // Use Vaul nested drawer for submenu layers
    return (
      <SubCtx.Provider value={value}>
        <Drawer.NestedRoot
          open={open}
          onOpenChange={(o) => {
            setOpen(o)
            if (o) {
              // Claim focus for the child surface when the nested drawer opens
              setOwnerId(childSurfaceId)
              // focus input/list shortly after mount
              requestAnimationFrame(() => {
                const content = contentRef.current
                const { input, list } = findWidgetsWithinSurface(content!)
                ;(input ?? list)?.focus()
              })
            } else {
              // returning focus/selection to parent surface
              setOwnerId(parentSurfaceId)
              parentStore.setActiveId(triggerItemId)
              requestAnimationFrame(() => {
                const parentEl = document.querySelector<HTMLElement>(
                  `[data-surface-id="${parentSurfaceId}"]`,
                )
                const { input, list } = findWidgetsWithinSurface(parentEl)
                ;(input ?? list)?.focus()
              })
            }
          }}
        >
          {children}
        </Drawer.NestedRoot>
      </SubCtx.Provider>
    )
  }

  return (
    <SubCtx.Provider value={value}>
      <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
        {children}
      </Popover.Root>
    </SubCtx.Provider>
  )
}
