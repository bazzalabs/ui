'use client'

import * as React from 'react'
import type { ItemContextValue } from '../../../listbox/index.js'
import type { CheckedChangeReason } from '../../events.js'

/**
 * Context value for checkbox menu items.
 * Extends ItemContextValue with checkbox-specific state.
 */
export interface CheckboxItemContextValue extends ItemContextValue {
  /** Whether this checkbox item is currently checked */
  checked: boolean
  /**
   * Toggle the checked state.
   * @param reason - The reason for the change (default: 'item-press')
   * @param event - The native DOM event that triggered the change
   */
  toggle: (reason?: CheckedChangeReason, event?: Event) => void
}

const CheckboxItemContext =
  React.createContext<CheckboxItemContextValue | null>(null)

export function useCheckboxItemContext(): CheckboxItemContextValue {
  const context = React.useContext(CheckboxItemContext)
  if (!context) {
    throw new Error(
      'PopupMenu.CheckboxItemIndicator must be used within PopupMenu.CheckboxItem',
    )
  }
  return context
}

export { CheckboxItemContext }
