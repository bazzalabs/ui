'use client'

import * as React from 'react'

export interface RadioGroupContextValue<T = unknown> {
  /** Current selected value */
  value: T | undefined
  /** Function to update the selected value */
  setValue: (value: T) => void
  /** Whether all items in the group are disabled */
  disabled: boolean
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(
  null,
)

export function useRadioGroupContext<T = unknown>(): RadioGroupContextValue<T> {
  const context = React.useContext(RadioGroupContext)
  if (!context) {
    throw new Error(
      'DropdownMenu.RadioItem must be used within DropdownMenu.RadioGroup',
    )
  }
  return context as RadioGroupContextValue<T>
}

export { RadioGroupContext }
