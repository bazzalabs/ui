import type { ItemDef, ItemNode, MenuNodeDefaults } from '@bazza-ui/menu'
import {
  type InteractionGuardOptions,
  GlobalThemeProvider as PopupMenuGlobalThemeProvider,
  ScopedThemeProvider as PopupMenuScopedThemeProvider,
} from '@bazza-ui/popup-menu'
import * as React from 'react'
import { SelectContent } from './components/content.js'
import { SelectRoot } from './components/root.js'
import { SelectTrigger } from './components/trigger.js'
import { SelectValue } from './components/value.js'
import {
  defaultSelectSlots,
  mergeTheme,
  GlobalThemeProvider as SelectGlobalThemeProvider,
  ScopedThemeProvider as SelectScopedThemeProvider,
} from './contexts/theme-context.js'
import type {
  MultiSelectProps,
  SelectItemDef,
  SelectMenuDef,
  SelectSlots,
  SelectTheme,
  SelectThemeDef,
} from './types.js'

// ================================================================================================
// Compound Component Types
// ================================================================================================

export interface CompoundMultiSelectTriggerProps {
  /** Trigger content - should include MultiSelect.Value for displaying selection */
  children: React.ReactNode
  /** Whether to use child as trigger (for composition) */
  asChild?: boolean
  /** Whether the trigger is disabled */
  disabled?: boolean
  /** Accessible label */
  'aria-label'?: string
  /** ID of element that labels this select */
  'aria-labelledby'?: string
  /** ID of element that describes this select */
  'aria-describedby'?: string
  /** Whether this select has a validation error */
  'aria-invalid'?: boolean
  /** Whether this field is required */
  'aria-required'?: boolean
}

/**
 * Context passed to MultiSelectValue render function.
 */
export interface MultiSelectValueRenderContext<TData = unknown> {
  /** The selected nodes - provides access to icon, label, data, etc. */
  nodes?: (ItemNode<TData> | ItemDef<TData>)[]
  /** Placeholder text when no values selected */
  placeholder: string
}

export interface CompoundMultiSelectValueProps<TData = unknown> {
  /** Placeholder text (overrides Root's placeholder) */
  placeholder?: string
  /**
   * Render function for custom value display.
   *
   * @example
   * ```tsx
   * <MultiSelect.Value>
   *   {(values, { nodes, placeholder }) => (
   *     nodes && nodes.length > 0
   *       ? nodes.map(n => n.label).join(', ')
   *       : placeholder
   *   )}
   * </MultiSelect.Value>
   * ```
   */
  children?: (
    values: string[] | undefined,
    context: MultiSelectValueRenderContext<TData>,
  ) => React.ReactNode
}

export type CreateMultiSelectResult<T = unknown> = React.FC<
  MultiSelectOptions<T>
> & {
  Trigger: React.FC<CompoundMultiSelectTriggerProps>
  Value: React.FC<CompoundMultiSelectValueProps<T>>
}

export type CreateMultiSelectOptions<T = unknown> = {
  slots?: SelectThemeDef<T>['slots']
  slotProps?: SelectThemeDef<T>['slotProps']
  classNames?: SelectThemeDef<T>['classNames']
  defaults?: Partial<MenuNodeDefaults<T>>
}

export interface MultiSelectOptions<T = unknown>
  extends Partial<InteractionGuardOptions> {
  // ===== Value Management (Array) =====
  /** Current selected values (controlled) */
  value?: string[]
  /** Default values (uncontrolled) */
  defaultValue?: string[]
  /** Called when selection changes */
  onValueChange?: (values: string[]) => void

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
  /**
   * Compound component children (required).
   * Must include MultiSelect.Trigger with MultiSelect.Value inside:
   * ```tsx
   * <MultiSelect items={items}>
   *   <MultiSelect.Trigger>
   *     <MultiSelect.Value />
   *   </MultiSelect.Trigger>
   * </MultiSelect>
   * ```
   */
  children: React.ReactNode

  // ===== Options (Simple API) =====
  /** Simple array of items (most common use case) */
  items?: SelectItemDef<T>[]

  // ===== Options (Advanced API) =====
  /** Full menu definition (for advanced use cases) */
  menu?: SelectMenuDef<T>

  // ===== MultiSelect Specific =====
  /** Maximum number of selections allowed */
  max?: number
  /** Minimum number of selections required */
  min?: number
  /** Whether to close the listbox after selecting an item (default: false for multi) */
  closeOnSelect?: boolean

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
  /** Theme overrides at instance level */
  slots?: SelectThemeDef<T>['slots']
  slotProps?: SelectThemeDef<T>['slotProps']
  classNames?: SelectThemeDef<T>['classNames']
  /** Default configurations for menu behavior */
  defaults?: Partial<MenuNodeDefaults<T>>
  /** Ref for programmatic control */
  controlRef?: React.Ref<import('./control.js').MultiSelectControl<T>>
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
      // Note: variant, checked, and onCheckedChange are added by SelectContent's transformNodes
      value: item.value,
    })) as any, // Cast to any because checkbox properties are added dynamically
  }
}

/**
 * Creates a MultiSelect component with factory-level theme defaults.
 *
 * Uses compound component pattern - must include MultiSelect.Trigger with MultiSelect.Value:
 * ```tsx
 * const MultiSelect = createMultiSelect()
 *
 * <MultiSelect items={items} value={values} onValueChange={setValues} name="fruits">
 *   <MultiSelect.Trigger>
 *     <MultiSelect.Value placeholder="Select fruits..." />
 *   </MultiSelect.Trigger>
 * </MultiSelect>
 * ```
 *
 * MultiSelect allows selecting multiple values and keeps the listbox open by default.
 */
export function createMultiSelect<T = unknown>(
  opts?: CreateMultiSelectOptions<T>,
): CreateMultiSelectResult<T> {
  // Factory theme
  const factoryTheme = {
    slots: { ...defaultSelectSlots<T>(), ...opts?.slots } as Required<
      SelectSlots<T>
    >,
    slotProps: opts?.slotProps,
    classNames: opts?.classNames,
  } as SelectTheme<T>

  // Factory defaults
  const factoryDefaults = opts?.defaults

  function MultiSelect(props: MultiSelectOptions<T>) {
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
      max,
      min,
      closeOnSelect = false, // Default: keep open for multi-select
      side = 'bottom',
      align = 'start',
      sideOffset = 4,
      alignOffset = 0,
      onOpenChange,
      open,
      defaultOpen,
      modal,
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

    // Wrap onValueChange to enforce max/min constraints
    const handleValueChange = React.useCallback(
      (newValues: string[]) => {
        let finalValues = newValues

        // Enforce max constraint
        if (max !== undefined && finalValues.length > max) {
          finalValues = finalValues.slice(0, max)
        }

        // Enforce min constraint (prevent going below min)
        if (min !== undefined && finalValues.length < min) {
          // Don't allow the change if it would violate min
          return
        }

        onValueChange?.(finalValues)
      },
      [onValueChange, max, min],
    )

    // Generate menu from items if provided, otherwise use menu prop
    const menu = React.useMemo(() => {
      if (items) {
        return itemsToMenuDef(items, 'multiselect-menu')
      }
      return menuProp
    }, [items, menuProp])

    if (!menu) {
      throw new Error(
        'MultiSelect requires either "items" or "menu" prop to be provided',
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
      <SelectGlobalThemeProvider theme={instanceTheme}>
        <SelectScopedThemeProvider theme={scopedTheme as any}>
          <PopupMenuGlobalThemeProvider theme={instanceTheme as any}>
            <PopupMenuScopedThemeProvider theme={scopedTheme as any}>
              <SelectRoot
                menu={menu}
                values={value}
                defaultValues={defaultValue}
                onValuesChange={handleValueChange}
                disabled={disabled}
                open={open}
                defaultOpen={defaultOpen}
                onOpenChange={onOpenChange}
                modal={modal}
                multiple={true}
                defaults={mergedDefaults}
                controlRef={controlRef as any}
                // Form integration
                name={name}
                form={form}
                required={required}
                placeholder={placeholder}
                // InteractionGuard options
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
                {children}
                <SelectContent
                  menu={menu}
                  side={side}
                  align={align}
                  sideOffset={sideOffset}
                  alignOffset={alignOffset}
                  defaults={mergedDefaults}
                  placeholder={placeholder}
                />
              </SelectRoot>
            </PopupMenuScopedThemeProvider>
          </PopupMenuGlobalThemeProvider>
        </SelectScopedThemeProvider>
      </SelectGlobalThemeProvider>
    )
  }

  // Compound component: MultiSelect.Trigger
  const CompoundTrigger: React.FC<CompoundMultiSelectTriggerProps> = ({
    children,
    asChild,
    disabled,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
  }) => {
    return (
      <SelectTrigger
        asChild={asChild}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        aria-invalid={ariaInvalid}
        aria-required={ariaRequired}
      >
        {children}
      </SelectTrigger>
    )
  }
  CompoundTrigger.displayName = 'MultiSelect.Trigger'

  // Compound component: MultiSelect.Value
  const CompoundValue: React.FC<CompoundMultiSelectValueProps<T>> = ({
    placeholder,
    children,
  }) => {
    // Adapt the render function signature for multi-select
    const adaptedChildren = children
      ? (
          value: string | string[] | undefined,
          context: { node?: any; nodes?: any[]; placeholder: string },
        ) => {
          // For multi select, pass the string[] values (or undefined)
          return children(value as string[] | undefined, {
            nodes: context.nodes,
            placeholder: context.placeholder,
          })
        }
      : undefined

    return (
      <SelectValue placeholder={placeholder}>{adaptedChildren}</SelectValue>
    )
  }
  CompoundValue.displayName = 'MultiSelect.Value'

  // Attach compound components
  const MultiSelectWithCompound = MultiSelect as CreateMultiSelectResult<T>
  MultiSelectWithCompound.Trigger = CompoundTrigger
  MultiSelectWithCompound.Value = CompoundValue

  return MultiSelectWithCompound
}
