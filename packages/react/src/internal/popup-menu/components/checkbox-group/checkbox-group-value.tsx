'use client'

import * as React from 'react'
import type { CheckboxValueChangeEventDetails } from '../../events.js'
import {
  CheckboxGroupContext,
  type CheckboxGroupContextValue,
  createRegisterItemValue,
  useCheckboxGroupStore,
} from './checkbox-group-context.js'

export interface PopupMenuCheckboxGroupValueProps {
  /**
   * The controlled array of checked item values.
   */
  value: string[]

  /**
   * Callback fired when the selected value changes.
   * The second parameter contains event details including the reason for the change.
   */
  onValueChange?: (
    value: string[],
    eventDetails: CheckboxValueChangeEventDetails,
  ) => void

  /**
   * Stable identifier for this group. Defaults to a generated id.
   */
  groupId?: string

  /**
   * Whether all items in this group are disabled.
   * @default false
   */
  disabled?: boolean

  /**
   * Children to render within the checkbox group context.
   */
  children: React.ReactNode
}

/**
 * Headless provider for checkbox group state.
 * Use this when you compose checkbox items yourself and do not want a wrapper element.
 * Does not render any DOM element - only provides context.
 *
 * @example
 * ```tsx
 * const [layout, setLayout] = useState(['minimap'])
 *
 * <DropdownMenu.CheckboxGroupValue value={layout} onValueChange={setLayout}>
 *   <DropdownMenu.Surface content={content}>
 *     ...
 *   </DropdownMenu.Surface>
 * </DropdownMenu.CheckboxGroupValue>
 * ```
 */
export function PopupMenuCheckboxGroupValue(
  props: PopupMenuCheckboxGroupValueProps,
) {
  const {
    value,
    onValueChange,
    groupId: groupIdProp,
    disabled = false,
    children,
  } = props
  const generatedId = React.useId()
  const groupId = groupIdProp ?? generatedId
  const valueCountsRef = React.useRef<Map<string, number>>(new Map())
  const registerItemValue = React.useMemo(
    () => createRegisterItemValue(valueCountsRef.current),
    [],
  )

  // Always controlled: its items read `value` from the context, and it syncs
  // into the group's store for the events that read it.
  const store = useCheckboxGroupStore(value, undefined, onValueChange, false)

  const contextValue: CheckboxGroupContextValue = React.useMemo(
    () => ({
      groupId,
      store,
      controlledValue: value,
      disabled,
      registerItemValue,
    }),
    [groupId, store, value, disabled, registerItemValue],
  )

  return (
    <CheckboxGroupContext.Provider value={contextValue}>
      {children}
    </CheckboxGroupContext.Provider>
  )
}

export namespace PopupMenuCheckboxGroupValue {
  export interface Props extends PopupMenuCheckboxGroupValueProps {}
}
