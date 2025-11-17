import type { MenuDef } from '@bazza-ui/menu'
import {
  defaultSlots,
  GlobalThemeProvider,
  mergeTheme,
  ScopedThemeProvider,
  type PopupMenuTheme,
  type PopupMenuThemeDef,
  type InteractionGuardOptions,
} from '@bazza-ui/popup-menu'
import * as React from 'react'
import { ContextMenuContent } from './components/content.js'
import { ContextMenuRoot } from './components/root.js'
import { ContextMenuTrigger } from './components/trigger.js'

export type CreateContextMenuResult<T = unknown> = React.FC<
  ContextMenuOptions<T>
> & {
  Root: typeof ContextMenuRoot
  Trigger: typeof ContextMenuTrigger
  Content: typeof ContextMenuContent
}

export type CreateContextMenuOptions<T = unknown> = {
  slots?: PopupMenuThemeDef<T>['slots']
  slotProps?: PopupMenuThemeDef<T>['slotProps']
  classNames?: PopupMenuThemeDef<T>['classNames']
}

export interface ContextMenuOptions<T = unknown>
  extends Partial<InteractionGuardOptions> {
  /** Menu definition */
  menu: MenuDef<T>
  /** Trigger element - will open context menu on right-click */
  children: React.ReactNode
  /** Callback when menu opens/closes */
  onOpenChange?: (open: boolean) => void
  /** Whether the menu is open (controlled) */
  open?: boolean
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean
  /** Whether clicking outside closes the menu */
  modal?: boolean
  /** Whether to show debug visuals */
  debug?: boolean
  /** Placeholder for search input */
  placeholder?: string
  /** Theme overrides at instance level */
  slots?: PopupMenuThemeDef<T>['slots']
  slotProps?: PopupMenuThemeDef<T>['slotProps']
  classNames?: PopupMenuThemeDef<T>['classNames']
}

/**
 * Creates a ContextMenu component with factory-level theme defaults.
 * Supports theme override at three levels:
 * 1. Factory level (createContextMenu options)
 * 2. Instance level (component props)
 * 3. Menu/submenu level (menu.ui)
 */
export function createContextMenu<T = unknown>(
  opts?: CreateContextMenuOptions<T>,
): CreateContextMenuResult<T> {
  // Factory theme - from createContextMenu options
  const factoryTheme: PopupMenuTheme<any> = {
    slots: { ...defaultSlots<T>(), ...(opts?.slots as any) },
    slotProps: opts?.slotProps,
    classNames: opts?.classNames,
  }

  function ContextMenu({
    menu,
    children,
    placeholder = 'Search...',
    debug = false,
    slots,
    slotProps,
    classNames,
    // InteractionGuard options
    scopeAttr,
    disableOutsidePointerEvents,
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
    onDismiss,
    surfaceSelector,
    branchAttr,
    ...rootProps
  }: ContextMenuOptions<T>) {
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
          <ContextMenuRoot
            {...rootProps}
            menu={menu}
            scopeAttr={scopeAttr}
            disableOutsidePointerEvents={disableOutsidePointerEvents}
            onEscapeKeyDown={onEscapeKeyDown}
            onPointerDownOutside={onPointerDownOutside}
            onFocusOutside={onFocusOutside}
            onInteractOutside={onInteractOutside}
            onDismiss={onDismiss}
            surfaceSelector={surfaceSelector}
            branchAttr={branchAttr}
          >
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent menu={menu} placeholder={placeholder} debug={debug} />
          </ContextMenuRoot>
        </ScopedThemeProvider>
      </GlobalThemeProvider>
    )
  }

  const CompoundContextMenu = ContextMenu as CreateContextMenuResult<T>
  CompoundContextMenu.Root = ContextMenuRoot
  CompoundContextMenu.Trigger = ContextMenuTrigger
  CompoundContextMenu.Content = ContextMenuContent

  return CompoundContextMenu
}
