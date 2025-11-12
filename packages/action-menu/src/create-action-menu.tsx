import * as React from 'react'
import { Positioner } from './components/positioner.js'
import { type ActionMenuRootProps, Root } from './components/root.js'
import { Surface } from './components/surface.js'
import { Trigger } from './components/trigger.js'
import {
  GlobalThemeProvider,
  mergeTheme,
  ScopedThemeProvider,
} from './contexts/theme-context.js'
import { defaultSlots } from './lib/slots.js'
import type {
  ActionMenuClassNames,
  ActionMenuSlotProps,
  ActionMenuTheme,
  MenuDef,
  MenuNodeDefaults,
  SurfaceSlots,
} from './types.js'

export type CreateActionMenuResult<T = unknown> = React.FC<
  ActionMenuProps<T>
> & {
  Trigger: typeof Trigger
}

export type CreateActionMenuOptions<T> = {
  slots?: Partial<SurfaceSlots<T>>
  slotProps?: Partial<ActionMenuSlotProps>
  classNames?: Partial<ActionMenuClassNames>
  defaults?: Partial<MenuNodeDefaults<T>>
}

export interface ActionMenuProps<T = unknown> extends ActionMenuRootProps<T> {
  children: React.ReactNode
  menu: MenuDef<T>
  defaults?: Partial<MenuNodeDefaults<T>>
}

export function createActionMenu<T = unknown>(
  opts?: CreateActionMenuOptions<T>,
): CreateActionMenuResult<T> {
  const factoryTheme: ActionMenuTheme = {
    slots: { ...defaultSlots<T>(), ...(opts?.slots as any) },
    slotProps: opts?.slotProps,
    classNames: opts?.classNames,
  }

  const factoryDefaults = opts?.defaults

  function ActionMenu<T = unknown>(props: ActionMenuProps<T>) {
    const instanceTheme: ActionMenuTheme = React.useMemo(
      () =>
        mergeTheme(factoryTheme, {
          slots: props.slots,
          slotProps: props.slotProps,
          classNames: props.classNames,
        }),
      [props.slots, props.slotProps, props.classNames],
    )

    const scopedTheme = React.useMemo(
      () => props.menu.ui as ActionMenuTheme,
      [props.menu.ui],
    )

    // Merge factory defaults with instance defaults
    const mergedDefaults = React.useMemo<Partial<MenuNodeDefaults<T>>>(
      () => ({
        surface: { ...factoryDefaults?.surface, ...props.defaults?.surface },
        item: {
          ...factoryDefaults?.item,
          ...props.defaults?.item,
        } as any,
      }),
      [props.defaults],
    )

    return (
      <GlobalThemeProvider theme={instanceTheme}>
        <ScopedThemeProvider __scopeId="root" theme={scopedTheme}>
          <Root {...props}>
            {props.children}
            <Positioner>
              <Surface
                menu={props.menu}
                render={props.menu.render}
                defaults={mergedDefaults}
              />
            </Positioner>
          </Root>
        </ScopedThemeProvider>
      </GlobalThemeProvider>
    )
  }

  const CompoundActionMenu = ActionMenu as CreateActionMenuResult<T>
  CompoundActionMenu.Trigger = Trigger

  return CompoundActionMenu
}
