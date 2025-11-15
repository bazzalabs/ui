import type { MenuDef } from '@bazza-ui/menu'
import { defaultSlots } from '@bazza-ui/menu'
import * as React from 'react'
import { CommandMenuBreadcrumbs } from './components/breadcrumbs.js'
import { CommandMenuContent } from './components/content.js'
import { CommandMenuInput } from './components/input.js'
import { CommandMenuList } from './components/list.js'
import { CommandMenuRoot } from './components/root.js'
import { CommandMenuTrigger } from './components/trigger.js'
import {
  GlobalThemeProvider,
  mergeTheme,
  ScopedThemeProvider,
} from './contexts/theme-context.js'
import type {
  CommandMenuProps,
  CommandMenuTheme,
  CommandMenuThemeDef,
} from './types.js'

export type CreateCommandMenuResult<T = unknown> = React.FC<
  CommandMenuOptions<T>
> & {
  Root: typeof CommandMenuRoot
  Trigger: typeof CommandMenuTrigger
  Content: typeof CommandMenuContent
  Input: typeof CommandMenuInput
  List: typeof CommandMenuList
  Breadcrumbs: typeof CommandMenuBreadcrumbs
}

export type CreateCommandMenuOptions<T = unknown> = {
  slots?: CommandMenuThemeDef<T>['slots']
  slotProps?: CommandMenuThemeDef<T>['slotProps']
  classNames?: CommandMenuThemeDef<T>['classNames']
}

export interface CommandMenuOptions<T = unknown> extends CommandMenuProps<T> {
  /** Keyboard shortcut to open the command menu */
  shortcut?: string | string[]
  /** Placeholder text for the search input */
  placeholder?: string
  /** Optional trigger button to render */
  trigger?: React.ReactNode
  /** Menu definition */
  menu: MenuDef<T>
  /** Theme overrides at instance level */
  slots?: CommandMenuThemeDef<T>['slots']
  slotProps?: CommandMenuThemeDef<T>['slotProps']
  classNames?: CommandMenuThemeDef<T>['classNames']
}

/**
 * Creates a CommandMenu component with factory-level theme defaults.
 * Supports theme override at three levels:
 * 1. Factory level (createCommandMenu options)
 * 2. Instance level (component props)
 * 3. Menu/submenu level (menu.ui)
 */
export function createCommandMenu<T = unknown>(
  opts?: CreateCommandMenuOptions<T>,
): CreateCommandMenuResult<T> {
  // Factory theme - from createCommandMenu options
  const factoryTheme: CommandMenuTheme<T> = {
    slots: { ...defaultSlots<T>(), ...(opts?.slots as any) },
    slotProps: opts?.slotProps,
    classNames: opts?.classNames,
  }

  function CommandMenu<T = unknown>({
    shortcut = 'cmd+k',
    placeholder = 'Type a command or search...',
    trigger,
    menu,
    slots,
    slotProps,
    classNames,
    ...rootProps
  }: CommandMenuOptions<T>) {
    const [query, setQuery] = React.useState('')

    // Instance theme - merge factory with instance props
    const instanceTheme: CommandMenuTheme<T> = React.useMemo(
      () =>
        mergeTheme(factoryTheme as any, {
          slots,
          slotProps,
          classNames,
        }) as CommandMenuTheme<T>,
      [slots, slotProps, classNames],
    )

    // Scoped theme - from menu.ui
    const scopedTheme = React.useMemo(
      () => menu.ui as CommandMenuTheme<T> | undefined,
      [menu.ui],
    )

    // Clear query when menu closes
    React.useEffect(() => {
      if (!rootProps.open && rootProps.onOpenChange) {
        setQuery('')
      }
    }, [rootProps.open, rootProps.onOpenChange])

    return (
      <GlobalThemeProvider theme={instanceTheme as any}>
        <ScopedThemeProvider theme={scopedTheme as any}>
          <CommandMenuRoot {...rootProps} menu={menu} onQueryChange={setQuery}>
            <CommandMenuTrigger shortcut={shortcut}>
              {trigger}
            </CommandMenuTrigger>
            <CommandMenuContent>
              <CommandMenuBreadcrumbs />
              <CommandMenuList
                query={query}
                onQueryChange={setQuery}
                placeholder={placeholder}
              />
            </CommandMenuContent>
          </CommandMenuRoot>
        </ScopedThemeProvider>
      </GlobalThemeProvider>
    )
  }

  const CompoundCommandMenu = CommandMenu as CreateCommandMenuResult<T>
  CompoundCommandMenu.Root = CommandMenuRoot
  CompoundCommandMenu.Trigger = CommandMenuTrigger
  CompoundCommandMenu.Content = CommandMenuContent
  CompoundCommandMenu.Input = CommandMenuInput
  CompoundCommandMenu.List = CommandMenuList
  CompoundCommandMenu.Breadcrumbs = CommandMenuBreadcrumbs

  return CompoundCommandMenu
}
