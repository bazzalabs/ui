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
import { SelectContent } from './components/content.js'
import { SelectRoot } from './components/root.js'
import { SelectTrigger } from './components/trigger.js'
import { SelectValue } from './components/value.js'
import type { SelectItemDef, SelectMenuDef, SelectProps } from './types.js'

export type CreateSelectResult<T = unknown> = React.FC<SelectOptions<T>> & {
  Root: typeof SelectRoot
  Trigger: typeof SelectTrigger
  Content: typeof SelectContent
  Value: typeof SelectValue
}

export type CreateSelectOptions<T = unknown> = {
  slots?: PopupMenuThemeDef<T>['slots']
  slotProps?: PopupMenuThemeDef<T>['slotProps']
  classNames?: PopupMenuThemeDef<T>['classNames']
  defaults?: Partial<MenuNodeDefaults<T>>
}

export interface SelectOptions<T = unknown>
  extends Partial<InteractionGuardOptions> {
  // ===== Value Management =====
  /** Current selected value (controlled) */
  value?: string
  /** Default value (uncontrolled) */
  defaultValue?: string
  /** Called when selection changes */
  onValueChange?: (value: string) => void

  // ===== Form Integration =====
  /** Form field name for submission */
  name?: string
  /** Associate with a form by ID */
  form?: string
  /** Whether this field is required */
  required?: boolean
  /** Whether this select is disabled */
  disabled?: boolean

  // ===== Display =====
  /** Placeholder text when no value selected */
  placeholder?: string
  /** Trigger element customization */
  children?: React.ReactNode

  // ===== Options (Simple API) =====
  /** Simple array of items (most common use case) */
  items?: SelectItemDef<T>[]

  // ===== Options (Advanced API) =====
  /** Full menu definition (for advanced use cases) */
  menu?: SelectMenuDef<T>

  // ===== Accessibility =====
  /** Accessible label */
  'aria-label'?: string
  /** ID of element that labels this select */
  'aria-labelledby'?: string
  /** ID of element that describes this select */
  'aria-describedby'?: string
  /** Whether this select has a validation error */
  'aria-invalid'?: boolean

  // ===== Positioning =====
  /** Which side to position the listbox on */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** How to align the listbox with the trigger */
  align?: 'start' | 'center' | 'end'
  /** Offset from the trigger (perpendicular to side) */
  sideOffset?: number
  /** Offset along the alignment axis */
  alignOffset?: number

  // ===== Callbacks =====
  /** Called when the select opens/closes */
  onOpenChange?: (open: boolean) => void
  /** Called on blur (for form validation) */
  onBlur?: () => void

  // ===== Advanced =====
  /** Whether the listbox is open (controlled) */
  open?: boolean
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean
  /** Whether clicking outside closes the listbox */
  modal?: boolean
  /** Whether to use child as trigger (for composition) */
  asChild?: boolean
  /** Theme overrides at instance level */
  slots?: PopupMenuThemeDef<T>['slots']
  slotProps?: PopupMenuThemeDef<T>['slotProps']
  classNames?: PopupMenuThemeDef<T>['classNames']
  /** Default configurations for menu behavior */
  defaults?: Partial<MenuNodeDefaults<T>>
  /** Ref for programmatic control */
  controlRef?: React.Ref<import('./control.js').SelectControl<T>>
}

/**
 * Helper to convert simple items array to menu definition
 */
function itemsToMenuDef<T>(
  items: SelectItemDef<T>[],
  menuId: string,
): SelectMenuDef<T> {
  return {
    id: menuId,
    nodes: items.map((item) => ({
      kind: 'item' as const,
      id: item.value,
      label: item.label,
      disabled: item.disabled,
      icon: item.icon,
      description: item.description,
      data: item.data,
      // Store value on the node for easy access
      value: item.value,
    })),
  }
}

/**
 * Creates a Select component with factory-level theme defaults.
 * Supports theme override at three levels:
 * 1. Factory level (createSelect options)
 * 2. Instance level (component props)
 * 3. Menu level (menu.ui)
 */
export function createSelect<T = unknown>(
  opts?: CreateSelectOptions<T>,
): CreateSelectResult<T> {
  // Factory theme
  const factoryTheme = {
    slots: { ...defaultSlots(), ...opts?.slots } as PopupMenuSlots<T>,
    slotProps: opts?.slotProps,
    classNames: opts?.classNames,
  } as PopupMenuTheme<T>

  // Factory defaults
  const factoryDefaults = opts?.defaults

  function Select(props: SelectOptions<T>) {
    const {
      value,
      defaultValue,
      onValueChange,
      name,
      form,
      required,
      disabled,
      placeholder = 'Select...',
      children,
      items,
      menu: menuProp,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': ariaDescribedby,
      'aria-invalid': ariaInvalid,
      side = 'bottom',
      align = 'start',
      sideOffset = 4,
      alignOffset = 0,
      onOpenChange,
      onBlur,
      open,
      defaultOpen,
      modal,
      asChild,
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
    } = props

    // Generate menu from items if provided, otherwise use menu prop
    const menu = React.useMemo(() => {
      if (items) {
        return itemsToMenuDef(items, 'select-menu')
      }
      return menuProp
    }, [items, menuProp])

    if (!menu) {
      throw new Error(
        'Select requires either "items" or "menu" prop to be provided',
      )
    }

    // Instance theme - merge factory with instance props
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
          <SelectRoot
            menu={menu}
            value={value}
            defaultValue={defaultValue}
            onValueChange={onValueChange}
            disabled={disabled}
            open={open}
            defaultOpen={defaultOpen}
            onOpenChange={onOpenChange}
            modal={modal}
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
            <SelectTrigger
              asChild={asChild}
              disabled={disabled}
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledby}
              aria-describedby={ariaDescribedby}
              aria-invalid={ariaInvalid}
              aria-required={required}
              placeholder={placeholder}
            >
              {children || <SelectValue name={name} form={form} required={required} placeholder={placeholder} />}
            </SelectTrigger>
            <SelectContent
              menu={menu as PopupMenuDef<T>}
              side={side}
              align={align}
              sideOffset={sideOffset}
              alignOffset={alignOffset}
              defaults={mergedDefaults}
              placeholder={placeholder}
            />
          </SelectRoot>
        </ScopedThemeProvider>
      </GlobalThemeProvider>
    )
  }

  const CompoundSelect = Select as CreateSelectResult<T>
  CompoundSelect.Root = SelectRoot
  CompoundSelect.Trigger = SelectTrigger
  CompoundSelect.Content = SelectContent
  CompoundSelect.Value = SelectValue

  return CompoundSelect
}
