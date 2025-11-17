import { Popover } from '@base-ui-components/react/popover'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import { FocusOwnerCtx, InteractionGuard } from '@bazza-ui/popup-menu'
import * as React from 'react'
import { ContextMenuContent } from './components/content.js'
import { RootCtx } from './contexts/root-context.js'
import type { ContextMenuProps, ContextMenuRootContextValue } from './types.js'

/**
 * Context Menu Component
 *
 * A right-click context menu that uses @bazza-ui/menu for menu primitives
 * and @bazza-ui/popup-menu for popup-specific behavior.
 *
 * @example
 * ```tsx
 * <ContextMenu menu={menuDef}>
 *   <div>Right-click me</div>
 * </ContextMenu>
 * ```
 */
export function ContextMenu<T = unknown>({
  children,
  menu,
  onOpenChange,
  open: openProp,
  defaultOpen = false,
  debug = false,
  modal = true,
}: ContextMenuProps<T>) {
  const scopeId = React.useId()

  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: (value) => {
      console.log('[ContextMenu] Open state changed:', value)
      onOpenChange?.(value)
    },
  })

  const [anchorPoint, setAnchorPoint] = React.useState<{ x: number; y: number } | null>(null)
  const [ownerId, setOwnerId] = React.useState<string | null>(null)

  // Use state for virtual anchor like Base UI does
  const [virtualAnchor, setVirtualAnchor] = React.useState<HTMLElement | null>(() => {
    const rect: DOMRect = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => ({}),
    }
    return {
      getBoundingClientRect: () => rect,
    } as unknown as HTMLElement
  })

  // Track if we just opened to prevent immediate close from the same event
  const ignoreNextOutsideInteraction = React.useRef(false)

  React.useEffect(() => {
    console.log('[ContextMenu] Mounted with menu:', menu)
  }, [])

  React.useEffect(() => {
    console.log('[ContextMenu] Open:', open, 'AnchorPoint:', anchorPoint, 'VirtualAnchor:', virtualAnchor)
  }, [open, anchorPoint, virtualAnchor])

  const closeAllSurfaces = React.useCallback(() => {
    console.log('[ContextMenu] Closing all surfaces')
    setOpen(false)
  }, [setOpen])

  const onOpenToggle = React.useCallback(
    () => (open ? closeAllSurfaces() : setOpen(true)),
    [open, closeAllSurfaces, setOpen],
  )

  const handleContextMenu = (event: React.MouseEvent) => {
    console.log('[ContextMenu] Context menu triggered at:', event.clientX, event.clientY)
    event.preventDefault()

    const point = { x: event.clientX, y: event.clientY }
    setAnchorPoint(point)

    // Create virtual anchor using state (like Base UI)
    const rect: DOMRect = {
      x: point.x,
      y: point.y,
      width: 0,  // Base UI uses 0 for mouse events, 10 for touch
      height: 0,
      top: point.y,
      right: point.x,
      bottom: point.y,
      left: point.x,
      toJSON: () => ({}),
    }

    setVirtualAnchor({
      getBoundingClientRect: () => rect,
    } as unknown as HTMLElement)

    console.log('[ContextMenu] Virtual anchor created')

    // Ignore the next outside interaction (the mouseup from this right-click)
    ignoreNextOutsideInteraction.current = true

    setOpen(true)
  }

  const rootCtxValue: ContextMenuRootContextValue = React.useMemo(
    () => ({
      scopeId,
      open,
      onOpenChange: setOpen,
      onOpenToggle,
      modal,
      debug,
      anchorPoint,
      setAnchorPoint,
      closeAllSurfaces,
    }),
    [scopeId, open, setOpen, onOpenToggle, modal, debug, anchorPoint, closeAllSurfaces],
  )

  console.log('[ContextMenu] Rendering - open:', open, 'anchorPoint:', anchorPoint, 'virtualAnchor:', virtualAnchor)
  console.log('[ContextMenu] Should render portal?', open && anchorPoint && virtualAnchor)

  return (
    <RootCtx.Provider value={rootCtxValue}>
      <FocusOwnerCtx.Provider value={{ ownerId, setOwnerId }}>
        <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
          <div onContextMenu={handleContextMenu}>
            {children}
          </div>
          {open && anchorPoint && virtualAnchor && (
            <Popover.Portal>
              <InteractionGuard.Root
                scopeId={scopeId}
                disableOutsidePointerEvents={modal}
                onEscapeKeyDown={() => closeAllSurfaces()}
                onInteractOutside={(event) => {
                  console.log('[ContextMenu] onInteractOutside triggered:', event.target)

                  // Ignore the first outside interaction after opening (the mouseup from right-click)
                  if (ignoreNextOutsideInteraction.current) {
                    console.log('[ContextMenu] Ignoring first outside interaction after opening')
                    ignoreNextOutsideInteraction.current = false
                    return
                  }

                  const target = event.target as HTMLElement | null
                  if (target?.closest?.('[data-menu-surface]')) {
                    console.log('[ContextMenu] Ignoring - clicked on menu surface')
                    return
                  }
                  console.log('[ContextMenu] Closing menu due to outside interaction')
                  event.preventDefault()
                  closeAllSurfaces()
                }}
                surfaceSelector="[data-menu-surface]"
              >
                <Popover.Positioner
                  anchor={virtualAnchor}
                  side="bottom"
                  align="start"
                  sideOffset={2}
                  collisionPadding={8}
                >
                  <Popover.Popup>
                    <ContextMenuContent menu={menu} />
                  </Popover.Popup>
                </Popover.Positioner>
              </InteractionGuard.Root>
            </Popover.Portal>
          )}
        </Popover.Root>
      </FocusOwnerCtx.Provider>
    </RootCtx.Provider>
  )
}
