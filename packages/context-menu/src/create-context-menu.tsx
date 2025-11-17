import * as React from 'react'
import { ContextMenu as ContextMenuBase } from './context-menu.js'
import {
  GlobalThemeProvider,
  mergeTheme,
  ScopedThemeProvider,
} from './contexts/theme-context.js'
import { defaultSlots } from './lib/slots.js'
import type {
  ContextMenuClassNames,
  ContextMenuSlotProps,
  ContextMenuSlots,
  ContextMenuTheme,
  ContextMenuThemeDef,
  ContextMenuProps,
} from './types.js'

export type CreateContextMenuOptions<T = unknown> = {
  slots?: Partial<ContextMenuSlots<T>>
  slotProps?: Partial<ContextMenuSlotProps>
  classNames?: Partial<ContextMenuClassNames>
}

export interface ThemedContextMenuProps<T = unknown> extends ContextMenuProps<T> {
  slots?: Partial<ContextMenuSlots<T>>
  slotProps?: Partial<ContextMenuSlotProps>
  classNames?: Partial<ContextMenuClassNames>
}

export type CreateContextMenuResult<T = unknown> = React.FC<
  ThemedContextMenuProps<T>
>

/**
 * Creates a themed context menu component with preset styling and slots.
 *
 * @param opts - Factory-level theme configuration (slots, slotProps, classNames)
 * @returns A ContextMenu component with preset theming
 *
 * @example
 * ```tsx
 * const MyContextMenu = createContextMenu({
 *   classNames: {
 *     content: 'border bg-popover rounded-lg shadow-md',
 *     item: 'px-4 py-2 hover:bg-accent',
 *   },
 * })
 *
 * // Use it:
 * <MyContextMenu menu={menuDef}>
 *   <div>Right-click me</div>
 * </MyContextMenu>
 * ```
 */
export function createContextMenu<T = unknown>(
  opts?: CreateContextMenuOptions<T>,
): CreateContextMenuResult<T> {
  // Create factory theme by merging defaults with factory options
  const factoryTheme: ContextMenuTheme<T> = {
    slots: { ...defaultSlots<T>(), ...(opts?.slots as any) },
    slotProps: opts?.slotProps,
    classNames: opts?.classNames,
  }

  function ThemedContextMenu(props: ThemedContextMenuProps<T>) {
    // Merge factory theme with instance props
    const instanceTheme = React.useMemo(
      () =>
        mergeTheme(factoryTheme as any, {
          slots: props.slots as any,
          slotProps: props.slotProps,
          classNames: props.classNames,
        } as any) as ContextMenuTheme<T>,
      [props.slots, props.slotProps, props.classNames],
    )

    // Extract scoped theme from menu.ui if provided
    const scopedTheme = React.useMemo(
      () => (props.menu.ui ? (props.menu.ui as ContextMenuTheme<T>) : instanceTheme),
      [props.menu.ui, instanceTheme],
    )

    return (
      <GlobalThemeProvider theme={instanceTheme as any}>
        <ScopedThemeProvider __scopeId="root" theme={scopedTheme as any}>
          <ContextMenuBase {...props} />
        </ScopedThemeProvider>
      </GlobalThemeProvider>
    )
  }

  return ThemedContextMenu as CreateContextMenuResult<T>
}
