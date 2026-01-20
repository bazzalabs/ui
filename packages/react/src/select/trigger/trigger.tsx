'use client'

import { Popover, type PopoverTriggerProps } from '@base-ui/react/popover'
import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import { usePopupMenuContext } from '../../internal/popup-menu/contexts/popup-menu-context.js'
import type { ComponentProps } from '../../utils/types.js'
import { useSelectContext } from '../contexts/select-context.js'
import { SelectTriggerDataAttributes } from './trigger.data-attrs.js'

export { SelectTriggerDataAttributes }

export interface SelectTriggerState extends Record<string, unknown> {
  /**
   * Whether the select is open.
   */
  open: boolean
  /**
   * Whether the select is disabled.
   */
  disabled: boolean
  /**
   * Whether the select currently shows placeholder (no value selected).
   */
  placeholder: boolean
}

export interface SelectTriggerProps
  extends ComponentProps<'button', SelectTrigger.State> {
  /**
   * Whether the trigger is disabled.
   */
  disabled?: boolean
}

const stateAttributesMapping = {
  open: (value: unknown): Record<string, string> | null =>
    value ? { [SelectTriggerDataAttributes.open]: '' } : null,
  disabled: (value: unknown): Record<string, string> | null =>
    value ? { [SelectTriggerDataAttributes.disabled]: '' } : null,
  placeholder: (value: unknown): Record<string, string> | null =>
    value ? { [SelectTriggerDataAttributes.placeholder]: '' } : null,
}

/**
 * Inner component that renders using useRender.
 * This allows us to use hooks while being called from Popover.Trigger's render prop.
 */
const SelectTriggerInner = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps & {
    triggerProps: React.ComponentPropsWithRef<'button'>
    triggerState: { open: boolean }
  }
>(function SelectTriggerInner(props, forwardedRef) {
  const {
    render,
    children,
    disabled: disabledProp,
    className,
    style,
    triggerProps,
    triggerState,
    ...rest
  } = props

  const selectContext = useSelectContext()
  const disabled = disabledProp ?? selectContext.disabled

  // Determine if showing placeholder
  const hasValue = selectContext.multiple
    ? selectContext.values.length > 0
    : selectContext.value !== ''

  const state: SelectTrigger.State = React.useMemo(
    () => ({
      open: triggerState.open,
      disabled,
      placeholder: !hasValue,
    }),
    [triggerState.open, disabled, hasValue],
  )

  // Register trigger element for positioning
  const internalRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      selectContext.setTriggerElement(node)
    },
    [selectContext],
  )

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...triggerProps,
      ...rest,
      [SelectTriggerDataAttributes.slot]: '',
      ref: internalRef,
      role: 'combobox' as const,
      'aria-haspopup': 'listbox' as const,
      'aria-controls': selectContext.listId,
      className,
      style,
      children,
    },
    defaultTagName: 'button',
  })
})

/**
 * A button that opens the select dropdown.
 * Renders a `<button>` element with combobox ARIA semantics.
 */
export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTrigger.Props
>(function SelectTrigger(props, forwardedRef) {
  const { disabled: disabledProp, ...rest } = props
  const selectContext = useSelectContext()
  const disabled = disabledProp ?? selectContext.disabled

  return (
    <Popover.Trigger
      ref={forwardedRef}
      disabled={disabled}
      render={(triggerProps, triggerState) => (
        <SelectTriggerInner
          {...rest}
          disabled={disabled}
          triggerProps={triggerProps}
          triggerState={triggerState}
          ref={triggerProps.ref as React.Ref<HTMLButtonElement>}
        />
      )}
    />
  )
})

export namespace SelectTrigger {
  export interface Props extends SelectTriggerProps {}
  export type State = SelectTriggerState
}
