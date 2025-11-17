import type { MenuDef } from '@bazza-ui/menu'
import {
  defaultSlots,
  GlobalThemeProvider,
  mergeTheme,
  type PopupMenuTheme,
  type PopupMenuThemeDef,
  ScopedThemeProvider,
} from '@bazza-ui/popup-menu'
import * as React from 'react'
import { DropdownMenuContent } from './components/content.js'
import { DropdownMenuRoot } from './components/root.js'
import { DropdownMenuTrigger } from './components/trigger.js'

export type CreateDropdownMenuResult<T = unknown> = React.FC<
  DropdownMenuOptions<T>
> & {
  Root: typeof DropdownMenuRoot
  Trigger: typeof DropdownMenuTrigger
  Content: typeof DropdownMenuContent
}

export type CreateDropdownMenuOptions<T = unknown> = {
  slots?: PopupMenuThemeDef<T>['slots']
  slotProps?: PopupMenuThemeDef<T>['slotProps']
  classNames?: PopupMenuThemeDef<T>['classNames']
}

export interface DropdownMenuOptions<T = unknown> {
  /** Menu definition */
  menu: MenuDef<T>
  /** Trigger element - will open dropdown menu on click */
  children: React.ReactNode
  /** Callback when menu opens/closes */
  onOpenChange?: (open: boolean) => void
  /** Whether the menu is open (controlled) */
  open?: boolean
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean
  /** Whether clicking outside closes the menu */
  modal?: boolean
  /** Placeholder for search input */
  placeholder?: string
  /** Side of the trigger to position the menu */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Alignment relative to the trigger */
  align?: 'start' | 'center' | 'end'
  /** Offset from the trigger */
  sideOffset?: number
  /** Theme overrides at instance level */
  slots?: PopupMenuThemeDef<T>['slots']
  slotProps?: PopupMenuThemeDef<T>['slotProps']
  classNames?: PopupMenuThemeDef<T>['classNames']
}

/**
 * Creates a DropdownMenu component with factory-level theme defaults.
 * Supports theme override at three levels:
 * 1. Factory level (createDropdownMenu options)
 * 2. Instance level (component props)
 * 3. Menu/submenu level (menu.ui)
 */
export function createDropdownMenu<T = unknown>(
  opts?: CreateDropdownMenuOptions<T>,
): CreateDropdownMenuResult<T> {
  // Factory theme - from createDropdownMenu options
  const factoryTheme: PopupMenuTheme<any> = {
    slots: { ...defaultSlots<T>(), ...(opts?.slots as any) },
    slotProps: opts?.slotProps,
    classNames: opts?.classNames,
  }

  function DropdownMenu({
    menu,
    children,
    placeholder = 'Search...',
    side = 'bottom',
    align = 'start',
    sideOffset = 4,
    slots,
    slotProps,
    classNames,
    ...rootProps
  }: DropdownMenuOptions<T>) {
    // Instance theme - merge factory with instance props
    const instanceTheme: PopupMenuTheme<any> = React.useMemo(
      () =>
        mergeTheme(factoryTheme, {
          slots: slots as any,
          slotProps,
          classNames,
        }),
      [slots, slotProps, classNames],
    )

    // Scoped theme - from menu.ui
    const scopedTheme = React.useMemo(
      () => menu.ui as PopupMenuTheme<any> | undefined,
      [menu.ui],
    )

    return (
      <GlobalThemeProvider theme={instanceTheme}>
        <ScopedThemeProvider theme={scopedTheme as any}>
          <DropdownMenuRoot {...rootProps} menu={menu}>
            <DropdownMenuTrigger>{children}</DropdownMenuTrigger>
            <DropdownMenuContent
              menu={menu}
              placeholder={placeholder}
              side={side}
              align={align}
              sideOffset={sideOffset}
            />
          </DropdownMenuRoot>
        </ScopedThemeProvider>
      </GlobalThemeProvider>
    )
  }

  const CompoundDropdownMenu = DropdownMenu as CreateDropdownMenuResult<T>
  CompoundDropdownMenu.Root = DropdownMenuRoot
  CompoundDropdownMenu.Trigger = DropdownMenuTrigger
  CompoundDropdownMenu.Content = DropdownMenuContent

  return CompoundDropdownMenu
}
