'use client'

import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect'
import { useRefWithInit } from '@base-ui/utils/useRefWithInit'
import { useStableCallback } from '@base-ui/utils/useStableCallback'
import * as React from 'react'
import type { CheckboxValueChangeEventDetails } from '../../events.js'
import { CheckboxGroupStore } from '../../store/CheckboxGroupStore.js'

/**
 * A checkbox group, for its items. Made once with the group: it changes
 * only with `disabled` (or a `groupId` prop), never with the group's value,
 * which items read from `store` by their own value (`isChecked`).
 */
export interface CheckboxGroupContextValue {
  /** Stable identifier of the group (rows sharing it commit together). */
  groupId: string
  /** The group's value, and its only writer (`setValue`). */
  store: CheckboxGroupStore
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
 * `onValueChange`.
 */
export function useCheckboxGroupStore(
  value: string[] | undefined,
  defaultValue: string[] | undefined,
  onValueChange:
    | ((value: string[], eventDetails: CheckboxValueChangeEventDetails) => void)
    | undefined,
): CheckboxGroupStore {
  const handleValueChange = useStableCallback(onValueChange)
  const store = useRefWithInit(
    () =>
      new CheckboxGroupStore({
        value,
        defaultValue: defaultValue ?? [],
        onValueChange: handleValueChange,
      }),
  ).current
  useIsoLayoutEffect(() => {
    store.control(value)
  }, [store, value])
  return store
}

export { CheckboxGroupContext }
