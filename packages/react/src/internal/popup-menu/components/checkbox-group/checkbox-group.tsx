'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import {
  createChangeEventDetails,
  REASONS,
} from '../../../../utils/events/index.js'
import type { ComponentProps } from '../../../../utils/types.js'
import { GroupContext, useSurfaceContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { usePopupMenuContext } from '../../contexts/popup-menu-context.js'
import type {
  CheckboxValueChangeEventDetails,
  CheckboxValueChangeReason,
} from '../../events.js'
import { PopupMenuCheckboxGroupDataAttributes } from './checkbox-group.data-attrs.js'
import {
  CheckboxGroupContext,
  type CheckboxGroupContextValue,
  createRegisterItemValue,
} from './checkbox-group-context.js'

export { PopupMenuCheckboxGroupDataAttributes }

export interface PopupMenuCheckboxGroupState extends Record<string, unknown> {
  /**
   * Whether the checkbox group is disabled.
   */
  disabled: boolean
  /**
   * Present when this is the first visible group in the list.
   */
  firstGroup: boolean
  /**
   * Present when this is the last visible group in the list.
   */
  lastGroup: boolean
  first: boolean
  last: boolean
}

export interface PopupMenuCheckboxGroupProps
  extends ComponentProps<'div', PopupMenuCheckboxGroup.State> {
  /**
   * The controlled array of checked item values.
   */
  value?: string[]

  /**
   * The default checked values for uncontrolled mode. @default []
   */
  defaultValue?: string[]

  /**
   * Callback fired when the selected value changes.
   * The second parameter contains event details including the reason for the change.
   */
  onValueChange?: (
    value: string[],
    eventDetails: CheckboxValueChangeEventDetails,
  ) => void

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
    value ? { [PopupMenuCheckboxGroupDataAttributes.disabled]: '' } : null,
  firstGroup: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuCheckboxGroupDataAttributes.firstGroup]: '' } : null,
  lastGroup: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuCheckboxGroupDataAttributes.lastGroup]: '' } : null,
  first: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuCheckboxGroupDataAttributes.first]: '' } : null,
  last: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuCheckboxGroupDataAttributes.last]: '' } : null,
}

/**
 * Groups checkbox items together and owns their checked state as one array of values.
 * Renders a `<div>` element with role="group".
 */
export const PopupMenuCheckboxGroup = React.forwardRef(
  function PopupMenuCheckboxGroup(
    props: PopupMenuCheckboxGroupProps,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {
      value: valueProp,
      defaultValue,
      onValueChange,
      disabled: disabledProp = false,
      forceMount = false,
      render,
      className,
      style,
      children,
      ...rest
    } = props

    const { store } = useSurfaceContext()
    const popupMenuContext = usePopupMenuContext()
    const groupId = React.useId()
    const internalRef = React.useRef<HTMLDivElement>(null)
    const [rowElement, setRowElement] = React.useState<HTMLElement | null>(null)

    const disabled = disabledProp || popupMenuContext.disabled

    // Controlled/uncontrolled state management
    const [internalValue, setInternalValue] = React.useState<string[]>(
      () => defaultValue ?? [],
    )
    const isControlled = valueProp !== undefined
    const value = isControlled ? valueProp : internalValue

    const setValue = React.useCallback(
      (
        newValue: string[],
        reason: CheckboxValueChangeReason = REASONS.itemPress,
        event?: Event,
      ) => {
        const eventDetails = createChangeEventDetails(reason, event)

        // Call user's callback first
        onValueChange?.(newValue, eventDetails)

        // If canceled, don't update internal state
        if (eventDetails.isCanceled) return false

        if (!isControlled) {
          setInternalValue(newValue)
        }
        return true
      },
      [isControlled, onValueChange],
    )

    const valueCountsRef = React.useRef<Map<string, number>>(new Map())
    const registerItemValue = React.useMemo(
      () => createRegisterItemValue(valueCountsRef.current),
      [],
    )

    // Register group with store for filtering visibility
    React.useEffect(() => {
      const unregister = store.registerGroup(groupId, internalRef)
      return unregister
    }, [groupId, store])

    React.useLayoutEffect(() => {
      if (!rowElement) return undefined
      return store.registerRow(groupId, rowElement, { kind: 'group' })
    }, [rowElement, groupId, store])

    // Check visibility using selector
    const isGroupVisible = store.useState('isGroupVisible', groupId)
    const isVisible = forceMount || isGroupVisible
    const isFirstGroup = store.useState('isFirstGroup', groupId)
    const isLastGroup = store.useState('isLastGroup', groupId)
    const isFirstRow = store.useState('isFirstRow', groupId)
    const isLastRow = store.useState('isLastRow', groupId)

    // Context values
    const checkboxGroupContextValue: CheckboxGroupContextValue = React.useMemo(
      () => ({ groupId, value, setValue, disabled, registerItemValue }),
      [groupId, value, setValue, disabled, registerItemValue],
    )

    const groupContextValue = React.useMemo(() => ({ groupId }), [groupId])

    const state: PopupMenuCheckboxGroup.State = React.useMemo(
      () => ({
        disabled,
        firstGroup: isFirstGroup,
        lastGroup: isLastGroup,
        first: isFirstRow,
        last: isLastRow,
      }),
      [disabled, isFirstGroup, isLastGroup, isFirstRow, isLastRow],
    )

    // Get component name for slot attribute
    const componentName = useMaybeComponentName()
    const slotAttr = getSlotAttribute(componentName, 'checkbox-group')

    const element = useRender({
      render,
      ref: [internalRef, setRowElement, forwardedRef],
      state,
      stateAttributesMapping,
      props: {
        ...rest,
        ...(slotAttr ? { [slotAttr]: '' } : {}),
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
      <CheckboxGroupContext.Provider value={checkboxGroupContextValue}>
        <GroupContext.Provider value={groupContextValue}>
          {element}
        </GroupContext.Provider>
      </CheckboxGroupContext.Provider>
    )
  },
)

export namespace PopupMenuCheckboxGroup {
  export type State = PopupMenuCheckboxGroupState
  export interface Props extends PopupMenuCheckboxGroupProps {}
}
