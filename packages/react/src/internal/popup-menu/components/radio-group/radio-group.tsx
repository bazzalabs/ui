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
  RadioValueChangeEventDetails,
  RadioValueChangeReason,
} from '../../events.js'
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

export interface PopupMenuRadioGroupProps
  extends ComponentProps<'div', PopupMenuRadioGroup.State> {
  /**
   * The controlled selected value.
   */
  value?: string

  /**
   * The default value for uncontrolled mode.
   */
  defaultValue?: string

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
   * Whether to force render this group regardless of filter results.
   * @default false
   */
  forceMount?: boolean

  children: React.ReactNode
}

const stateAttributesMapping = {
  disabled: (value: unknown) =>
    value ? { [PopupMenuRadioGroupDataAttributes.disabled]: '' } : null,
  firstGroup: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuRadioGroupDataAttributes.firstGroup]: '' } : null,
  lastGroup: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuRadioGroupDataAttributes.lastGroup]: '' } : null,
  first: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuRadioGroupDataAttributes.first]: '' } : null,
  last: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuRadioGroupDataAttributes.last]: '' } : null,
}

/**
 * Groups radio items together and manages the selected value.
 * Only one item can be selected at a time within a radio group.
 * Renders a `<div>` element with role="group".
 */
export const PopupMenuRadioGroup = React.forwardRef(
  function PopupMenuRadioGroup(
    props: PopupMenuRadioGroupProps,
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
    const [internalValue, setInternalValue] = React.useState<
      string | undefined
    >(defaultValue)
    const isControlled = valueProp !== undefined
    const value = isControlled ? valueProp : internalValue

    const setValue = React.useCallback(
      (
        newValue: string,
        reason: RadioValueChangeReason = REASONS.itemPress,
        event?: Event,
      ) => {
        const eventDetails = createChangeEventDetails(reason, event)

        // Call user's callback first
        onValueChange?.(newValue, eventDetails)

        // If canceled, don't update internal state
        if (eventDetails.isCanceled) return

        if (!isControlled) {
          setInternalValue(newValue)
        }
      },
      [isControlled, onValueChange],
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
    const radioGroupContextValue: RadioGroupContextValue = React.useMemo(
      () => ({ value, setValue, disabled }),
      [value, setValue, disabled],
    )

    const groupContextValue = React.useMemo(() => ({ groupId }), [groupId])

    const state: PopupMenuRadioGroup.State = React.useMemo(
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
    const slotAttr = getSlotAttribute(componentName, 'radio-group')

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
      <RadioGroupContext.Provider value={radioGroupContextValue}>
        <GroupContext.Provider value={groupContextValue}>
          {element}
        </GroupContext.Provider>
      </RadioGroupContext.Provider>
    )
  },
)

export namespace PopupMenuRadioGroup {
  export type State = PopupMenuRadioGroupState
  export interface Props extends PopupMenuRadioGroupProps {}
}
