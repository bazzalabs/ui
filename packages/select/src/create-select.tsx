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
import {
  SelectValue,
  type SelectValueRenderContext,
} from './components/value.js'
import {
  defaultSelectSlots,
  mergeTheme,
  GlobalThemeProvider as SelectGlobalThemeProvider,
  ScopedThemeProvider as SelectScopedThemeProvider,
} from './contexts/theme-context.js'
import type {
  SelectItemDef,
  SelectMenuDef,
  SelectSlots,
  SelectTheme,
  SelectThemeDef,
} from './types.js'

// ================================================================================================
// Compound Component Types
// ================================================================================================

export interface CompoundSelectTriggerProps {
  /** Trigger content - should include Select.Value for displaying selection */
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

export interface CompoundSelectValueProps<TData = unknown> {
  /** Placeholder text (overrides Root's placeholder) */
  placeholder?: string
  /**
   * Render function for custom value display.
   *
   * @example
   * ```tsx
   * <Select.Value>
   *   {(value, { node, placeholder }) => (
   *     node ? (
   *       <span className="flex items-center gap-2">
   *         {node.icon && <span>{node.icon}</span>}
   *         <span>{node.label}</span>
   *       </span>
   *     ) : (
   *       <span className="text-muted">{placeholder}</span>
   *     )
   *   )}
   * </Select.Value>
   * ```
   */
  children?: (
    value: string | undefined,
    context: SelectValueRenderContext<TData>,
  ) => React.ReactNode
}

export type CreateSelectResult<T = unknown> = React.FC<SelectOptions<T>> & {
  Trigger: React.FC<CompoundSelectTriggerProps>
  Value: React.FC<CompoundSelectValueProps<T>>
}

export type CreateSelectOptions<T = unknown> = {
  slots?: SelectThemeDef<T>['slots']
  slotProps?: SelectThemeDef<T>['slotProps']
  classNames?: SelectThemeDef<T>['classNames']
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
  /**
   * Compound component children (required).
   * Must include Select.Trigger with Select.Value inside:
   * ```tsx
   * <Select items={items}>
   *   <Select.Trigger>
   *     <Select.Value />
   *   </Select.Trigger>
   * </Select>
   * ```
   */
  children: React.ReactNode

  // ===== Options (Simple API) =====
  /** Simple array of items (most common use case) */
  items?: SelectItemDef<T>[]

  // ===== Options (Advanced API) =====
  /** Full menu definition (for advanced use cases) */
  menu?: SelectMenuDef<T>

  // ===== Positioning =====
  /** Which side to position the listbox on */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** How to align the listbox with the trigger */
  align?: 'start' | 'center' | 'end'
  /** Offset from the trigger (perpendicular to side) */
  sideOffset?: number
  /** Offset along the alignment axis */
  alignOffset?: number
  /** Whether the popup should track the anchor element's position (default: true) */
  trackAnchor?: boolean

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
 *
 * Uses compound component pattern - must include Select.Trigger with Select.Value:
 * ```tsx
 * const Select = createSelect()
 *
 * <Select items={items} value={value} onValueChange={setValue} name="fruit">
 *   <Select.Trigger>
 *     <Select.Value placeholder="Select a fruit..." />
 *   </Select.Trigger>
 * </Select>
 * ```
 *
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
    slots: { ...defaultSelectSlots<T>(), ...opts?.slots } as Required<
      SelectSlots<T>
    >,
    slotProps: opts?.slotProps,
    classNames: opts?.classNames,
  } as SelectTheme<T>

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
      side = 'bottom',
      align = 'start',
      sideOffset = 4,
      alignOffset = 0,
      trackAnchor,
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
      <SelectGlobalThemeProvider theme={instanceTheme}>
        <SelectScopedThemeProvider theme={scopedTheme as any}>
          <PopupMenuGlobalThemeProvider theme={instanceTheme as any}>
            <PopupMenuScopedThemeProvider theme={scopedTheme as any}>
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
                  trackAnchor={trackAnchor}
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

  // Compound component: Select.Trigger
  const CompoundTrigger: React.FC<CompoundSelectTriggerProps> = ({
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
  CompoundTrigger.displayName = 'Select.Trigger'

  // Compound component: Select.Value
  const CompoundValue: React.FC<CompoundSelectValueProps<T>> = ({
    placeholder,
    children,
  }) => {
    // Adapt the render function signature for single-select
    const adaptedChildren = children
      ? (
          value: string | string[] | undefined,
          context: { node?: any; nodes?: any[]; placeholder: string },
        ) => {
          // For single select, pass the string value (or undefined)
          return children(value as string | undefined, {
            node: context.node,
            placeholder: context.placeholder,
          })
        }
      : undefined

    return (
      <SelectValue placeholder={placeholder}>{adaptedChildren}</SelectValue>
    )
  }
  CompoundValue.displayName = 'Select.Value'

  // Attach compound components
  const SelectWithCompound = Select as CreateSelectResult<T>
  SelectWithCompound.Trigger = CompoundTrigger
  SelectWithCompound.Value = CompoundValue

  return SelectWithCompound
}
