'use client'

import { Popover, type PopoverTriggerProps } from '@base-ui/react/popover'
import * as React from 'react'
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

export interface SelectTriggerProps extends PopoverTriggerProps {}

/**
 * A button that opens the select dropdown.
 * Renders a `<button>` element with combobox ARIA semantics.
 */
export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps
>(function SelectTrigger(props, forwardedRef) {
  const { children, disabled: disabledProp, className, style, ...rest } = props

  const selectContext = useSelectContext()
  const disabled = disabledProp ?? selectContext.disabled

  // Determine if showing placeholder
  const hasValue = selectContext.multiple
    ? selectContext.values.length > 0
    : selectContext.value !== ''

  // Build data attributes
  const dataAttrs: Record<string, string> = {}
  if (disabled) {
    dataAttrs[SelectTriggerDataAttributes.disabled] = ''
  }
  if (!hasValue) {
    dataAttrs[SelectTriggerDataAttributes.placeholder] = ''
  }

  // Register trigger element for positioning
  const mergedRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      selectContext.setTriggerElement(node)
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
    },
    [forwardedRef, selectContext],
  )

  return (
    <Popover.Trigger
      ref={mergedRef}
      disabled={disabled}
      role="combobox"
      aria-haspopup="listbox"
      aria-controls={selectContext.listId}
      className={className}
      style={style}
      {...dataAttrs}
      {...rest}
    >
      {children}
    </Popover.Trigger>
  )
})

export namespace SelectTrigger {
  export interface Props extends SelectTriggerProps {}
  export type State = SelectTriggerState
}
