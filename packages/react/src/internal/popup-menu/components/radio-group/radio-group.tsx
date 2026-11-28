'use client'

import { useRender } from '@base-ui/react/use-render'
import type { RadioGroupFields } from '@bazza-ui/menu-core'
import * as React from 'react'
import {
  resolveClassName,
  resolveStyle,
} from '../../../../utils/resolve-state-props.js'
import type { ComponentProps } from '../../../../utils/types.js'
import { useRowPosition } from '../../../listbox/hooks/use-row-position.js'
import { GroupContext, useSurfaceContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useMenuSurfaceSettings } from '../../contexts/surface-settings-context.js'
import { useGroupVisibility } from '../group/use-group-visibility.js'
import { PopupMenuRadioGroupDataAttributes } from './radio-group.data-attrs.js'
import {
  RadioGroupContext,
  type RadioGroupContextValue,
  useRadioGroupStore,
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

interface PopupMenuRadioGroupChildrenProps {
  /**
   * The group's name, used as the description of its options
   * (`aria-describedby` on each one). Takes precedence over the text of a
   * `GroupLabel` inside the group, and stays even while no `GroupLabel` is
   * mounted, as in a windowed list scrolled past the label row.
   */
  label?: string

  children: React.ReactNode
}

export interface PopupMenuRadioGroupProps
  extends RadioGroupFields,
    PopupMenuRadioGroupChildrenProps,
    Omit<ComponentProps<'div', PopupMenuRadioGroup.State>, 'children'> {}

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
 * Renders a `<div>` element with role="presentation".
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
      label,
      render,
      className,
      style,
      children,
      ...rest
    } = props

    const { store } = useSurfaceContext()
    const menuDisabled = useMenuSurfaceSettings().disabled
    const groupId = React.useId()
    const internalRef = React.useRef<HTMLDivElement>(null)
    const [rowElement, setRowElement] = React.useState<HTMLElement | null>(null)

    const disabled = disabledProp || menuDisabled

    // The selected value lives in the group's own store, which its items
    // read.
    const groupStore = useRadioGroupStore(
      valueProp,
      defaultValue,
      onValueChange,
      true,
    )

    const { isVisible, groupContextValue, descriptionElement } =
      useGroupVisibility({
        store,
        groupId,
        forceMount,
        ref: internalRef,
        rowElement,
        label,
      })
    const {
      firstGroup: isFirstGroup,
      lastGroup: isLastGroup,
      first: isFirstRow,
      last: isLastRow,
    } = useRowPosition(store, groupId)

    // Context values
    const radioGroupContextValue: RadioGroupContextValue = React.useMemo(
      () => ({ store: groupStore, controlledValue: valueProp, disabled }),
      [groupStore, valueProp, disabled],
    )

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
        // Presentational like every group kind, even though a radio or
        // checkbox group is the textbook case for role="group" (ADR-0005).
        // Its items carry aria-disabled themselves.
        role: 'presentation',
        hidden: isVisible ? rest.hidden : true,
        className: resolveClassName(className, state),
        style: isVisible
          ? resolveStyle(style, state)
          : { ...resolveStyle(style, state), display: 'none' },
        children: (
          <>
            {descriptionElement}
            {children}
          </>
        ),
      },
      defaultTagName: 'div',
    })

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
