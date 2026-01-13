'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { GroupContext, useSurfaceContext } from '../../../listbox/index.js'
import { PopupMenuRadioGroupDataAttributes } from './radio-group.data-attrs.js'
import {
  RadioGroupContext,
  type RadioGroupContextValue,
} from './radio-group-context.js'

export { PopupMenuRadioGroupDataAttributes }

export interface PopupMenuRadioGroupState extends Record<string, unknown> {
  /**
   * Whether the radio group is disabled.
   */
  disabled: boolean
}

export interface PopupMenuRadioGroupProps<T = unknown>
  extends ComponentProps<'div', PopupMenuRadioGroupState> {
  /**
   * The controlled selected value.
   */
  value?: T

  /**
   * The default value for uncontrolled mode.
   */
  defaultValue?: T

  /**
   * Callback fired when the selected value changes.
   */
  onValueChange?: (value: T) => void

  /**
   * Whether all items in this group are disabled.
   * @default false
   */
  disabled?: boolean

  /**
   * Whether to force render this group regardless of filter results.
   * @default false
   */
  forceMount?: boolean

  children: React.ReactNode
}

const stateAttributesMapping = {
  disabled: (value: unknown) =>
    value ? { [PopupMenuRadioGroupDataAttributes.disabled]: '' } : null,
}

/**
 * Groups radio items together and manages the selected value.
 * Only one item can be selected at a time within a radio group.
 * Renders a `<div>` element with role="group".
 */
export const PopupMenuRadioGroup = React.forwardRef(
  function PopupMenuRadioGroup<T>(
    props: PopupMenuRadioGroupProps<T>,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {
      value: valueProp,
      defaultValue,
      onValueChange,
      disabled = false,
      forceMount = false,
      render,
      className,
      style,
      children,
      ...rest
    } = props

    const { store } = useSurfaceContext()
    const groupId = React.useId()

    // Controlled/uncontrolled state management
    const [internalValue, setInternalValue] = React.useState<T | undefined>(
      defaultValue,
    )
    const isControlled = valueProp !== undefined
    const value = isControlled ? valueProp : internalValue

    const setValue = React.useCallback(
      (newValue: T) => {
        if (!isControlled) {
          setInternalValue(newValue)
        }
        onValueChange?.(newValue)
      },
      [isControlled, onValueChange],
    )

    // Register group with store for filtering visibility
    React.useEffect(() => {
      const unregister = store.registerGroup(groupId)
      return unregister
    }, [groupId, store])

    // Check visibility using selector
    const isGroupVisible = store.useState('isGroupVisible', groupId)
    const isVisible = forceMount || isGroupVisible

    // Context values
    const radioGroupContextValue: RadioGroupContextValue<T> = React.useMemo(
      () => ({ value, setValue, disabled }),
      [value, setValue, disabled],
    )

    const groupContextValue = React.useMemo(() => ({ groupId }), [groupId])

    const state: PopupMenuRadioGroupState = React.useMemo(
      () => ({ disabled }),
      [disabled],
    )

    const element = useRender({
      render,
      ref: forwardedRef,
      state,
      stateAttributesMapping,
      props: {
        ...rest,
        role: 'group',
        'aria-disabled': disabled || undefined,
        className,
        style,
        children,
      },
      enabled: isVisible,
      defaultTagName: 'div',
    })

    if (!isVisible) {
      return null
    }

    return (
      <RadioGroupContext.Provider
        value={radioGroupContextValue as RadioGroupContextValue}
      >
        <GroupContext.Provider value={groupContextValue}>
          {element}
        </GroupContext.Provider>
      </RadioGroupContext.Provider>
    )
  },
) as <T = unknown>(
  props: PopupMenuRadioGroupProps<T> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement | null

export namespace PopupMenuRadioGroup {
  export type State = PopupMenuRadioGroupState
  export interface Props<T = unknown> extends PopupMenuRadioGroupProps<T> {}
}
