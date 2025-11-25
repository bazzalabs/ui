import { Popover } from '@base-ui-components/react/popover'
import { InteractionGuard } from '@bazza-ui/popup-menu'
import { mergeProps } from '@bazza-ui/theming'
import { composeRefs } from '@radix-ui/react-compose-refs'
import * as React from 'react'
import { useRootContext } from '../contexts/root-context.js'
import { useGlobalTheme, useScopedTheme } from '../contexts/theme-context.js'
import type { TriggerBindAPI } from '../types.js'
import { findNodeByValue, findNodesByValues } from '../utils/find-nodes.js'

export interface SelectTriggerProps {
  /** Trigger element - will open select listbox on click */
  children?: React.ReactNode
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
  /** Placeholder text when no value selected */
  placeholder?: string
}

/**
 * SelectTrigger - Click trigger that opens the select listbox.
 * Uses combobox ARIA pattern instead of menu pattern.
 */
export function SelectTrigger({
  children,
  asChild = false,
  disabled: propDisabled = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  placeholder = 'Select...',
}: SelectTriggerProps) {
  const {
    triggerRef,
    scopeId,
    open,
    selectedValue,
    selectedValues,
    multiple,
    disabled: contextDisabled,
    menu,
  } = useRootContext()

  // Get theme slots (scoped takes priority over global)
  const globalTheme = useGlobalTheme()
  const scopedTheme = useScopedTheme()
  const { slots, slotProps, classNames } = scopedTheme ?? globalTheme
  const TriggerSlot = slots?.Trigger
  const ValueSlot = slots?.Value

  // Combine: menu-wide OR prop-level disabled
  const isDisabled = contextDisabled || propDisabled

  // Find the selected node(s) from the menu
  const selectedNode = React.useMemo(
    () => (multiple ? undefined : findNodeByValue(menu, selectedValue)),
    [menu, selectedValue, multiple],
  )

  const selectedNodes = React.useMemo(
    () => (multiple ? findNodesByValues(menu, selectedValues) : undefined),
    [menu, selectedValues, multiple],
  )

  // Render display value using Value slot
  const displayValue = React.useMemo(() => {
    if (!ValueSlot) return placeholder

    return ValueSlot({
      value: selectedValue,
      values: selectedValues,
      multiple,
      placeholder,
      node: selectedNode,
      nodes: selectedNodes,
    })
  }, [
    ValueSlot,
    selectedValue,
    selectedValues,
    multiple,
    placeholder,
    selectedNode,
    selectedNodes,
  ])

  // Prevent default on pointerdown to avoid losing focus from input elements
  const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
    e.preventDefault()
  }, [])

  // Generate IDs for ARIA relationships
  const listboxId = `${scopeId}-listbox`

  // Create bind API factory
  const createTriggerBind = React.useCallback(
    (baseUIProps: any): TriggerBindAPI => {
      return {
        open,
        disabled: isDisabled,
        getTriggerProps: (overrides) => {
          const baseUIRef = baseUIProps?.ref
          const composedRef = baseUIRef
            ? composeRefs(triggerRef as any, baseUIRef)
            : triggerRef

          // First merge baseUIProps with our custom props
          const merged = mergeProps(baseUIProps, {
            ref: composedRef,
            role: 'combobox' as const,
            'aria-haspopup': 'listbox' as const,
            'aria-expanded': open,
            'aria-controls': listboxId,
            'aria-label': ariaLabel,
            'aria-labelledby': ariaLabelledby,
            'aria-describedby': ariaDescribedby,
            'aria-invalid': ariaInvalid,
            'aria-required': ariaRequired,
            disabled: isDisabled,
            onPointerDown: handlePointerDown,
            className: classNames?.trigger,
            ...slotProps?.trigger,
          })

          // Then merge with overrides
          return mergeProps(merged, overrides) as any
        },
      }
    },
    [
      open,
      isDisabled,
      triggerRef,
      listboxId,
      ariaLabel,
      ariaLabelledby,
      ariaDescribedby,
      ariaInvalid,
      ariaRequired,
      handlePointerDown,
      classNames?.trigger,
      slotProps?.trigger,
    ],
  )

  if (asChild) {
    // Custom trigger via children
    return (
      <InteractionGuard.Branch asChild scopeId={scopeId}>
        <Popover.Trigger
          render={(popoverProps) => {
            const bind = createTriggerBind(popoverProps)

            if (TriggerSlot) {
              // Use Trigger slot
              return (
                <TriggerSlot
                  bind={bind}
                  value={selectedValue}
                  values={selectedValues}
                  multiple={multiple}
                  placeholder={placeholder}
                >
                  {children}
                </TriggerSlot>
              ) as React.ReactElement
            }

            // Fallback: Clone child element with composed props
            if (React.isValidElement(children)) {
              return React.cloneElement(
                children as React.ReactElement,
                {
                  ...bind.getTriggerProps(),
                } as any,
              )
            }

            // Fallback to button if no valid child
            return (
              <button type="button" {...bind.getTriggerProps()}>
                {children}
              </button>
            )
          }}
        />
      </InteractionGuard.Branch>
    )
  }

  // Default trigger button
  return (
    <InteractionGuard.Branch asChild scopeId={scopeId}>
      <Popover.Trigger
        render={(popoverProps) => {
          const bind = createTriggerBind(popoverProps)

          if (TriggerSlot) {
            // Use Trigger slot
            return (
              <TriggerSlot
                bind={bind}
                value={selectedValue}
                values={selectedValues}
                multiple={multiple}
                placeholder={placeholder}
              >
                {children || displayValue}
              </TriggerSlot>
            ) as React.ReactElement
          }

          // Default button implementation
          return (
            <button type="button" {...bind.getTriggerProps()}>
              {children || displayValue}
            </button>
          )
        }}
      />
    </InteractionGuard.Branch>
  )
}
