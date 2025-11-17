import { Popover } from '@base-ui-components/react/popover'
import {
  PopupMenuContent,
  GlobalThemeProvider,
  defaultSlots,
  type PopupMenuTheme,
} from '@bazza-ui/popup-menu'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import type { DropdownMenuProps } from './types.js'

/**
 * DropdownMenu - A menu that opens on click
 * Uses PopupMenuContent from @bazza-ui/popup-menu for all rendering and filtering
 */
export function DropdownMenu<T = unknown>({
  menu,
  children,
  onOpenChange,
  open: controlledOpen,
  defaultOpen = false,
  modal = true,
  theme,
  placeholder = 'Search...',
  side = 'bottom',
  align = 'start',
  sideOffset = 4,
}: DropdownMenuProps<T>) {
  const [open, setOpen] = useControllableState({
    prop: controlledOpen,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  })

  const triggerRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Handle click on trigger element
  const handleClick = React.useCallback(() => {
    setOpen((prev) => !prev)
  }, [setOpen])

  // Close menu
  const handleClose = React.useCallback(() => {
    setOpen(false)
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
      <div ref={triggerRef} onClick={handleClick}>
        {children}
      </div>

      {/* Menu */}
      <Popover.Root open={open} onOpenChange={setOpen}>
        {open && (
          <Popover.Positioner
            side={side}
            align={align}
            sideOffset={sideOffset}
            className={theme?.classNames?.positioner}
            anchor={triggerRef.current}
          >
            <Popover.Popup>
              <PopupMenuContent
                menu={menu}
                open={open}
                onClose={handleClose}
                contentRef={contentRef as any}
                placeholder={placeholder}
              />
            </Popover.Popup>
          </Popover.Positioner>
        )}
      </Popover.Root>
    </GlobalThemeProvider>
  )
}
