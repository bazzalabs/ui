import { Popover } from '@base-ui-components/react/popover'
import {
  defaultSlots,
  GlobalThemeProvider,
  PopupMenuContent,
  type PopupMenuDef,
  type PopupMenuTheme,
  Positioner,
  RootProvider,
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
  alignOffset = 0,
}: DropdownMenuProps<T>) {
  const scopeId = React.useId()

  const [open, setOpen] = useControllableState({
    prop: controlledOpen,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  })

  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Handle click on trigger element
  const handleClick = React.useCallback(() => {
    setOpen(true)
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
      <button type="button" ref={triggerRef} onClick={handleClick}>
        {children}
      </button>

      {/* Menu */}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <RootProvider scopeId={scopeId} onClose={handleClose}>
          {open && triggerRef.current && (
            <Positioner
              side={side}
              align={align}
              sideOffset={sideOffset}
              alignOffset={alignOffset}
              anchor={triggerRef.current}
            >
              {(popupProps) => (
                <PopupMenuContent
                  menu={menu as PopupMenuDef<T>}
                  open={open}
                  onClose={handleClose}
                  contentRef={contentRef as any}
                  placeholder={placeholder}
                  popupProps={popupProps}
                />
              )}
            </Positioner>
          )}
        </RootProvider>
      </Popover.Root>
    </GlobalThemeProvider>
  )
}
