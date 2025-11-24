import * as React from 'react'
import { useRootContext } from '../contexts/root-context.js'

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
  const { selectedValue, selectedValues, multiple } = useRootContext()

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
