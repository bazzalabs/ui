'use client'

import * as React from 'react'
import type { CheckboxValueChangeReason } from '../../events.js'

export interface CheckboxGroupContextValue {
  /** Stable identifier of the group (used by later features to batch changes per group). */
  groupId: string
  /** Values of the currently checked items. */
  value: string[]
  /**
   * Replace the group's value. Returns `false` when the consumer's
   * `onValueChange` cancelled the change, `true` otherwise.
   * @param value - The new array of checked item values
   * @param reason - The reason for the change (default: 'item-press')
   * @param event - The native DOM event that triggered the change
   */
  setValue: (
    value: string[],
    reason?: CheckboxValueChangeReason,
    event?: Event,
  ) => boolean
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

export { CheckboxGroupContext }
