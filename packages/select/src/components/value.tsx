import * as React from 'react'
import { useRootContext } from '../contexts/root-context.js'
import { useGlobalTheme, useScopedTheme } from '../contexts/theme-context.js'
import { findNodeByValue, findNodesByValues } from '../utils/find-nodes.js'

export interface SelectValueProps {
  /** Form field name for submission */
  name?: string
  /** Associate with a form by ID */
  form?: string
  /** Whether this field is required */
  required?: boolean
  /** Placeholder text when no value selected */
  placeholder?: string
}

/**
 * SelectValue - Renders the selected value and hidden form input.
 * Use this in custom triggers to display the selected value.
 */
export function SelectValue({
  name,
  form,
  required,
  placeholder = 'Select...',
}: SelectValueProps) {
  const { selectedValue, selectedValues, multiple, menu } = useRootContext()

  // Get theme slots (scoped takes priority over global)
  const globalTheme = useGlobalTheme()
  const scopedTheme = useScopedTheme()
  const ValueSlot = scopedTheme?.slots?.Value ?? globalTheme?.slots?.Value

  // Find the selected node(s) from the menu
  const selectedNode = React.useMemo(
    () => (multiple ? undefined : findNodeByValue(menu, selectedValue)),
    [menu, selectedValue, multiple],
  )

  const selectedNodes = React.useMemo(
    () => (multiple ? findNodesByValues(menu, selectedValues) : undefined),
    [menu, selectedValues, multiple],
  )

  // Get display value using Value slot from theme
  const displayValue = React.useMemo(() => {
    if (!ValueSlot) {
      // Fallback to default behavior if no Value slot
      if (multiple && selectedValues && selectedValues.length > 0) {
        return `${selectedValues.length} selected`
      }
      if (!multiple && selectedValue) {
        return selectedValue
      }
      return placeholder
    }

    // Use the Value slot from theme with node data
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
    multiple,
    selectedValue,
    selectedValues,
    placeholder,
    selectedNode,
    selectedNodes,
  ])

  return (
    <>
      {/* Hidden input(s) for form submission */}
      {name && (
        <>
          {multiple ? (
            // Multiple hidden inputs for array submission
            selectedValues && selectedValues.length > 0 ? (
              selectedValues.map((value, index) => (
                <input
                  key={`${value}-${index}`}
                  type="hidden"
                  name={name}
                  value={value}
                  form={form}
                  required={required && index === 0}
                />
              ))
            ) : (
              // Empty hidden input to ensure field is submitted even when empty
              <input
                type="hidden"
                name={name}
                value=""
                form={form}
                required={required}
              />
            )
          ) : (
            // Single hidden input
            <input
              type="hidden"
              name={name}
              value={selectedValue ?? ''}
              form={form}
              required={required}
            />
          )}
        </>
      )}
      {/* Display value */}
      <span>{displayValue}</span>
    </>
  )
}
