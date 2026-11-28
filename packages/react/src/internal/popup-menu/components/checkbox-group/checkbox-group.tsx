'use client'

import { useRender } from '@base-ui/react/use-render'
import type { CheckboxGroupFields } from '@bazza-ui/menu-core'
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
import { usePopupMenuContext } from '../../contexts/popup-menu-context.js'
import { useGroupVisibility } from '../group/use-group-visibility.js'
import { PopupMenuCheckboxGroupDataAttributes } from './checkbox-group.data-attrs.js'
import {
  CheckboxGroupContext,
  type CheckboxGroupContextValue,
  createRegisterItemValue,
  useCheckboxGroupStore,
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

interface PopupMenuCheckboxGroupChildrenProps {
  /**
   * The group's name, used as the description of its options
   * (`aria-describedby` on each one). Takes precedence over the text of a
   * `GroupLabel` inside the group, and stays even while no `GroupLabel` is
   * mounted, as in a windowed list scrolled past the label row.
   */
  label?: string

  children: React.ReactNode
}

export interface PopupMenuCheckboxGroupProps
  extends CheckboxGroupFields,
    PopupMenuCheckboxGroupChildrenProps,
    Omit<ComponentProps<'div', PopupMenuCheckboxGroup.State>, 'children'> {}

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
 * Renders a `<div>` element with role="presentation".
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
      label,
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

    // The group's value lives in its own store, which its items read.
    const groupStore = useCheckboxGroupStore(
      valueProp,
      defaultValue,
      onValueChange,
    )

    const valueCountsRef = React.useRef<Map<string, number>>(new Map())
    const registerItemValue = React.useMemo(
      () => createRegisterItemValue(valueCountsRef.current),
      [],
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
    const checkboxGroupContextValue: CheckboxGroupContextValue = React.useMemo(
      () => ({ groupId, store: groupStore, disabled, registerItemValue }),
      [groupId, groupStore, disabled, registerItemValue],
    )

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
