import { Popover } from '@base-ui-components/react/popover'
import {
  PopupMenuContent,
  Positioner,
  GlobalThemeProvider,
  RootProvider,
  RootCloseProvider,
  defaultSlots,
  type PopupMenuTheme,
} from '@bazza-ui/popup-menu'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import type { ContextMenuProps } from './types.js'

/**
 * ContextMenu - A menu that opens on right-click
 * Uses PopupMenuContent from @bazza-ui/popup-menu for all rendering and filtering
 */
export function ContextMenu<T = unknown>({
  menu,
  children,
  onOpenChange,
  open: controlledOpen,
  defaultOpen = false,
  modal = true,
  theme,
  placeholder = 'Search...',
  debug = false,
}: ContextMenuProps<T>) {
  const scopeId = React.useId()

  const [open, setOpen] = useControllableState({
    prop: controlledOpen,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  })

  const [anchorPoint, setAnchorPoint] = React.useState<{
    x: number
    y: number
  } | null>(null)

  const contentRef = React.useRef<HTMLDivElement>(null)

  // Handle right-click on trigger element
  const handleContextMenu = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setAnchorPoint({ x: e.clientX, y: e.clientY })
      setOpen(true)
    },
    [setOpen],
  )

  // Close menu
  const handleClose = React.useCallback(() => {
    setOpen(false)
    setAnchorPoint(null)
  }, [setOpen])

  // Merge theme with defaults
  const mergedTheme = React.useMemo(() => {
    const defaults = defaultSlots<T>()
    return {
      slots: { ...defaults, ...theme?.slots },
      slotProps: theme?.slotProps,
      classNames: theme?.classNames,
    } as PopupMenuTheme<any>
  }, [theme])

  return (
    <GlobalThemeProvider theme={mergedTheme}>
      {/* Trigger */}
      <div onContextMenu={handleContextMenu}>{children}</div>

      {/* Menu */}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <RootProvider scopeId={scopeId}>
          <RootCloseProvider onClose={handleClose}>
            {open && anchorPoint && (
              <Positioner
                side="bottom"
                align="start"
                sideOffset={4}
                anchor={{
                  getBoundingClientRect: () => ({
                    x: anchorPoint.x,
                    y: anchorPoint.y,
                    width: 0,
                    height: 0,
                    top: anchorPoint.y,
                    left: anchorPoint.x,
                    right: anchorPoint.x,
                    bottom: anchorPoint.y,
                    toJSON: () => ({}),
                  }),
                }}
              >
                {(popupProps) => (
                  <PopupMenuContent
                    menu={menu}
                    open={open}
                    onClose={handleClose}
                    contentRef={contentRef as any}
                    placeholder={placeholder}
                    popupProps={popupProps}
                  />
                )}
              </Positioner>
            )}
          </RootCloseProvider>
        </RootProvider>
      </Popover.Root>

      {/* Debug visualization */}
      {debug && anchorPoint && (
        <div
          style={{
            position: 'fixed',
            left: anchorPoint.x,
            top: anchorPoint.y,
            width: 8,
            height: 8,
            background: 'red',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}
    </GlobalThemeProvider>
  )
}
