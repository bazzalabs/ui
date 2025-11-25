import type { MenuNodeDefaults } from '@bazza-ui/menu'
import {
  defaultSlots,
  GlobalThemeProvider,
  type InteractionGuardOptions,
  mergeTheme,
  type PopupMenuDef,
  type PopupMenuSlots,
  type PopupMenuTheme,
  type PopupMenuThemeDef,
  ScopedThemeProvider,
} from '@bazza-ui/popup-menu'
import * as React from 'react'
import { ContextMenuContent } from './components/content.js'
import { ContextMenuRoot } from './components/root.js'
import { ContextMenuTrigger } from './components/trigger.js'
import type { ContextMenuDef } from './types.js'

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
  defaults?: Partial<MenuNodeDefaults<T>>
}

export interface ContextMenuOptions<T = unknown>
  extends Partial<InteractionGuardOptions> {
  /** Menu definition */
  menu: ContextMenuDef<T>
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
  /** Whether the popup should track the anchor element's position (default: true) */
  trackAnchor?: boolean
  /** Theme overrides at instance level */
  slots?: PopupMenuThemeDef<T>['slots']
  slotProps?: PopupMenuThemeDef<T>['slotProps']
  classNames?: PopupMenuThemeDef<T>['classNames']
  /** Default configurations for menu behavior */
  defaults?: Partial<MenuNodeDefaults<T>>
  /** Ref for programmatic control of the context menu */
  controlRef?: React.Ref<import('./control.js').ContextMenuControl<T>>
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
  // Note: We use the non-generic Theme type internally since the theming system
  // uses PopupMenuSlots<unknown>. Slots are contravariant and work with any T.
  const factoryTheme = {
    slots: { ...defaultSlots(), ...opts?.slots } as PopupMenuSlots<T>,
    slotProps: opts?.slotProps,
    classNames: opts?.classNames,
  } as PopupMenuTheme<T>

  // Factory defaults
  const factoryDefaults = opts?.defaults

  function ContextMenu(props: ContextMenuOptions<T>) {
    const {
      menu,
      children,
      placeholder = 'Search...',
      debug = false,
      trackAnchor,
      slots,
      slotProps,
      classNames,
      defaults,
      controlRef,
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
    } = props

    // Instance theme - merge factory with instance props
    // Cast to non-generic type for mergeTheme compatibility
    const instanceTheme = React.useMemo(
      () =>
        mergeTheme(factoryTheme as any, {
          slots: slots as any,
          slotProps,
          classNames,
        }),
      [slots, slotProps, classNames],
    )

    // Scoped theme - from menu.ui
    const scopedTheme = React.useMemo(() => menu.ui, [menu.ui])

    // Merge factory defaults with instance defaults
    const mergedDefaults = React.useMemo<Partial<MenuNodeDefaults<T>>>(
      () => ({
        surface: { ...factoryDefaults?.surface, ...defaults?.surface },
        item: {
          ...factoryDefaults?.item,
          ...defaults?.item,
        } as any,
        virtualization: {
          ...factoryDefaults?.virtualization,
          ...defaults?.virtualization,
        } as any,
      }),
      [defaults],
    )

    return (
      <GlobalThemeProvider theme={instanceTheme}>
        <ScopedThemeProvider theme={scopedTheme as PopupMenuTheme | undefined}>
          <ContextMenuRoot
            {...rootProps}
            menu={menu}
            defaults={mergedDefaults}
            controlRef={controlRef}
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
            <ContextMenuContent
              menu={menu as PopupMenuDef<T>}
              placeholder={placeholder}
              debug={debug}
              trackAnchor={trackAnchor}
              defaults={mergedDefaults}
            />
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
