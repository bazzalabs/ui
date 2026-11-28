'use client'

import { useStableCallback } from '@base-ui/utils/useStableCallback'
import * as React from 'react'
import type { RadioValueChangeEventDetails } from '../../events.js'
import { useGroupValueStore } from '../../hooks/use-group-value-store.js'
import { RadioGroupStore } from '../../store/RadioGroupStore.js'

/**
 * A radio group, for its items. It changes with `disabled` and, while a prop
 * controls the group, with its value: an uncontrolled group's items read its
 * own value from `store` by their own value (`isSelected`), so selecting one
 * re-renders only the two items that change; a controlled group's items read
 * `controlledValue`, so they never render a value older than the props
 * they're rendered with.
 */
export interface RadioGroupContextValue {
  /** The group's own value, and the group's only writer (`setValue`). */
  store: RadioGroupStore
  /** The `value` prop, `undefined` while uncontrolled. */
  controlledValue: string | undefined
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

/**
 * A provider's `RadioGroupStore`, made with its first props: `value` syncs
 * into it from a layout effect, and it calls the latest `onValueChange`.
 * `ownsValue` is false for the headless `RadioGroupValue`, which keeps no
 * value of its own.
 */
export function useRadioGroupStore(
  value: string | undefined,
  defaultValue: string | undefined,
  onValueChange:
    | ((value: string, eventDetails: RadioValueChangeEventDetails) => void)
    | undefined,
  ownsValue: boolean,
): RadioGroupStore {
  const handleValueChange = useStableCallback(onValueChange)
  return useGroupValueStore(
    value,
    () =>
      new RadioGroupStore({
        value,
        defaultValue,
        // Items only ever select a value.
        onValueChange: (next, eventDetails) =>
          handleValueChange(next as string, eventDetails),
        ownsValue,
      }),
  )
}

export { RadioGroupContext }
