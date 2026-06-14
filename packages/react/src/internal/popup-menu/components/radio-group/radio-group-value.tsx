'use client'

import * as React from 'react'
import {
  createChangeEventDetails,
  REASONS,
} from '../../../../utils/events/index.js'
import type {
  RadioValueChangeEventDetails,
  RadioValueChangeReason,
} from '../../events.js'
import {
  RadioGroupContext,
  type RadioGroupContextValue,
} from './radio-group-context.js'

export interface PopupMenuRadioGroupValueProps {
  /**
   * The controlled selected value.
   */
  value: string | undefined

  /**
   * Callback fired when the selected value changes.
   * The second parameter contains event details including the reason for the change.
   */
  onValueChange?: (
    value: string,
    eventDetails: RadioValueChangeEventDetails,
  ) => void

  /**
   * Whether all items in this group are disabled.
   * @default false
   */
  disabled?: boolean

  /**
   * Children to render within the radio group context.
   */
  children: React.ReactNode
}

/**
 * Headless provider for radio group state.
 * Use this to wrap DataSurface when using RadioItems in deep search.
 * Does not render any DOM element - only provides context.
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = useState('light')
 *
 * <DropdownMenu.RadioGroupValue value={theme} onValueChange={setTheme}>
 *   <DropdownMenu.Surface content={content}>
 *     ...
 *   </DropdownMenu.Surface>
 * </DropdownMenu.RadioGroupValue>
 * ```
 */
export function PopupMenuRadioGroupValue(props: PopupMenuRadioGroupValueProps) {
  const { value, onValueChange, disabled = false, children } = props

  const setValue = React.useCallback(
    (
      newValue: string,
      reason: RadioValueChangeReason = REASONS.itemPress,
      event?: Event,
    ) => {
      const eventDetails = createChangeEventDetails(reason, event)
      onValueChange?.(newValue, eventDetails)
    },
    [onValueChange],
  )

  const contextValue: RadioGroupContextValue = React.useMemo(
    () => ({ value, setValue, disabled }),
    [value, setValue, disabled],
  )

  return (
    <RadioGroupContext.Provider value={contextValue}>
      {children}
    </RadioGroupContext.Provider>
  )
}

export namespace PopupMenuRadioGroupValue {
  export interface Props extends PopupMenuRadioGroupValueProps {}
}
