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
import { DropdownMenuContent } from './components/content.js'
import { DropdownMenuRoot } from './components/root.js'
import { DropdownMenuTrigger } from './components/trigger.js'
import type { DropdownMenuDef } from './types.js'

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
  defaults?: Partial<MenuNodeDefaults<T>>
}

export interface DropdownMenuOptions<T = unknown>
  extends Partial<InteractionGuardOptions> {
  /** Menu definition */
  menu: DropdownMenuDef<T>
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
  /** Which side to position the menu on */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** How to align the menu with the trigger */
  align?: 'start' | 'center' | 'end'
  /** Offset from the trigger (perpendicular to side) */
  sideOffset?: number
  /** Offset along the alignment axis */
  alignOffset?: number
  /** Whether to use child as trigger (for composition) */
  asChild?: boolean
  /** Theme overrides at instance level */
  slots?: PopupMenuThemeDef<T>['slots']
  slotProps?: PopupMenuThemeDef<T>['slotProps']
  classNames?: PopupMenuThemeDef<T>['classNames']
  /** Default configurations for menu behavior */
  defaults?: Partial<MenuNodeDefaults<T>>
  /** Ref for programmatic control of the dropdown menu */
  controlRef?: React.Ref<import('./control.js').DropdownMenuControl<T>>
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
  // Note: We use the non-generic Theme type internally since the theming system
  // uses PopupMenuSlots<unknown>. Slots are contravariant and work with any T.
  const factoryTheme = {
    slots: { ...defaultSlots(), ...opts?.slots } as PopupMenuSlots<T>,
    slotProps: opts?.slotProps,
    classNames: opts?.classNames,
  } as PopupMenuTheme<T>

  // Factory defaults
  const factoryDefaults = opts?.defaults

  function DropdownMenu(props: DropdownMenuOptions<T>) {
    const {
      menu,
      children,
      placeholder = 'Search...',
      side = 'bottom',
      align = 'start',
      sideOffset = 4,
      alignOffset = 0,
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
        <ScopedThemeProvider
          theme={scopedTheme as PopupMenuThemeDef | undefined}
        >
          <DropdownMenuRoot
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
            <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
            <DropdownMenuContent
              menu={menu as PopupMenuDef<T>}
              placeholder={placeholder}
              side={side}
              align={align}
              sideOffset={sideOffset}
              alignOffset={alignOffset}
              defaults={mergedDefaults}
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
