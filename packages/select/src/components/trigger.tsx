import { Popover } from '@base-ui-components/react/popover'
import { InteractionGuard } from '@bazza-ui/popup-menu'
import { composeRefs } from '@radix-ui/react-compose-refs'
import * as React from 'react'
import { useRootContext } from '../contexts/root-context.js'

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
    control,
    open,
    selectedValue,
    selectedValues,
    multiple,
    disabled: contextDisabled,
  } = useRootContext()

  // Combine: menu-wide OR prop-level disabled
  const isDisabled = contextDisabled || propDisabled

  // Get display value
  const displayValue = React.useMemo(() => {
    if (multiple && selectedValues && selectedValues.length > 0) {
      return `${selectedValues.length} selected`
    }
    if (!multiple && selectedValue) {
      return selectedValue
    }
    return placeholder
  }, [multiple, selectedValue, selectedValues, placeholder])

  // Prevent default on pointerdown to avoid losing focus from input elements
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
  }

  // Generate IDs for ARIA relationships
  const listboxId = `${scopeId}-listbox`

  // Combobox ARIA attributes
  const ariaAttrs = {
    role: 'combobox' as const,
    'aria-haspopup': 'listbox' as const,
    'aria-expanded': open,
    'aria-controls': listboxId,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
    // Note: aria-activedescendant would be set during keyboard navigation
    // This is handled by the popup-menu Surface component
  }

  if (asChild) {
    // Custom trigger via children
    return (
      <InteractionGuard.Branch asChild scopeId={scopeId}>
        <Popover.Trigger
          render={children as any}
          ref={composeRefs(triggerRef as any)}
          disabled={isDisabled}
          onPointerDown={handlePointerDown}
          {...ariaAttrs}
        />
      </InteractionGuard.Branch>
    )
  }

  // Default trigger button
  return (
    <InteractionGuard.Branch asChild scopeId={scopeId}>
      <Popover.Trigger
        ref={composeRefs(triggerRef as any)}
        disabled={isDisabled}
        onPointerDown={handlePointerDown}
        {...ariaAttrs}
      >
        {children || displayValue}
      </Popover.Trigger>
    </InteractionGuard.Branch>
  )
}
