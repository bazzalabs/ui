'use client'

import * as React from 'react'
import type { RadioValueChangeReason } from '../../events.js'

export interface RadioGroupContextValue {
  /** Current selected value */
  value: string | undefined
  /**
   * Function to update the selected value.
   * @param value - The new value to select
   * @param reason - The reason for the change (default: 'item-press')
   * @param event - The native DOM event that triggered the change
   */
  setValue: (
    value: string,
    reason?: RadioValueChangeReason,
    event?: Event,
  ) => void
  /** Whether all items in the group are disabled */
  disabled: boolean
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(
  null,
)

export function useRadioGroupContext(): RadioGroupContextValue {
  const context = React.useContext(RadioGroupContext)
  if (!context) {
    throw new Error(
      'PopupMenu.RadioItem must be used within PopupMenu.RadioGroup',
    )
  }
  return context
}

export { RadioGroupContext }
