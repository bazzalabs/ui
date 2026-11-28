'use client'

import { useStableCallback } from '@base-ui/utils/useStableCallback'
import * as React from 'react'
import type { CheckboxValueChangeEventDetails } from '../../events.js'
import { useGroupValueStore } from '../../hooks/use-group-value-store.js'
import { CheckboxGroupStore } from '../../store/CheckboxGroupStore.js'

/**
 * A checkbox group, for its items. It changes with `disabled` (or a
 * `groupId` prop) and, while a prop controls the group, with its value: an
 * uncontrolled group's items read its own value from `store` by their own
 * value (`isChecked`), so a change re-renders only the items it changes; a
 * controlled group's items read `controlledValue`, so they never render a
 * value older than the props they're rendered with.
 */
export interface CheckboxGroupContextValue {
  /** Stable identifier of the group (rows sharing it commit together). */
  groupId: string
  /** The group's own value, and the group's only writer (`setValue`). */
  store: CheckboxGroupStore
  /** The `value` prop, `undefined` while uncontrolled. */
  controlledValue: string[] | undefined
  /** Whether all items in the group are disabled */
  disabled: boolean
  /**
   * Called by each checkbox item on mount with its `value` so the group can
   * warn about duplicates in development. Returns an unregister function.
   */
  registerItemValue: (value: string) => () => void
}

const CheckboxGroupContext =
  React.createContext<CheckboxGroupContextValue | null>(null)

/** Returns the enclosing checkbox group context, or `null` outside a group. */
export function useMaybeCheckboxGroupContext(): CheckboxGroupContextValue | null {
  return React.useContext(CheckboxGroupContext)
}

/**
 * Creates the `registerItemValue` function for a provider. Warns once per
 * duplicate value in development. `counts` must be a ref-held Map.
 */
export function createRegisterItemValue(
  counts: Map<string, number>,
): (value: string) => () => void {
  // Values already warned about, so React StrictMode's double mount warns once.
  const warned = new Set<string>()
  return (value) => {
    const next = (counts.get(value) ?? 0) + 1
    counts.set(value, next)
    if (
      next === 2 &&
      !warned.has(value) &&
      process.env.NODE_ENV !== 'production'
    ) {
      warned.add(value)
      console.warn(
        `PopupMenu.CheckboxGroup: duplicate item value "${value}". Each checkbox item in a checkbox group needs a unique \`value\`.`,
      )
    }
    return () => {
      const current = counts.get(value) ?? 0
      if (current <= 1) counts.delete(value)
      else counts.set(value, current - 1)
    }
  }
}

/**
 * A provider's `CheckboxGroupStore`, made with its first props: `value`
 * syncs into it from a layout effect, and it calls the latest
 * `onValueChange`. `ownsValue` is false for the headless
 * `CheckboxGroupValue`, which keeps no value of its own.
 */
export function useCheckboxGroupStore(
  value: string[] | undefined,
  defaultValue: string[] | undefined,
  onValueChange:
    | ((value: string[], eventDetails: CheckboxValueChangeEventDetails) => void)
    | undefined,
  ownsValue: boolean,
): CheckboxGroupStore {
  const handleValueChange = useStableCallback(onValueChange)
  return useGroupValueStore(
    value,
    () =>
      new CheckboxGroupStore({
        value,
        defaultValue: defaultValue ?? [],
        onValueChange: handleValueChange,
        ownsValue,
      }),
  )
}

export { CheckboxGroupContext }
