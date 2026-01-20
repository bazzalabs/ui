'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useComboboxContext } from '../contexts/combobox-context.js'
import { ComboboxClearDataAttributes } from './clear.data-attrs.js'

export { ComboboxClearDataAttributes }

export interface ComboboxClearState extends Record<string, unknown> {
  /**
   * Whether the combobox has a value (clear button is actionable).
   */
  hasValue: boolean
  /**
   * Whether the combobox is disabled.
   */
  disabled: boolean
}

export interface ComboboxClearProps
  extends ComponentProps<'button', ComboboxClear.State> {
  /**
   * Whether to render the button even when there's no value to clear.
   * @default false
   */
  keepMounted?: boolean
}

/**
 * A button that clears the selected value(s) when clicked.
 * Renders a `<button>` element.
 */
export const ComboboxClear = React.forwardRef<
  HTMLButtonElement,
  ComboboxClear.Props
>(function ComboboxClear(props, forwardedRef) {
  const {
    keepMounted = false,
    disabled: disabledProp,
    render,
    className,
    style,
    onClick,
    ...rest
  } = props

  const comboboxContext = useComboboxContext()

  const disabled = disabledProp ?? comboboxContext.disabled

  const hasValue = comboboxContext.multiple
    ? comboboxContext.values.length > 0
    : comboboxContext.value !== ''

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (event.defaultPrevented) return

      if (comboboxContext.multiple) {
        comboboxContext.onValuesChange([])
      } else {
        comboboxContext.onValueChange('')
      }

      // Also clear the input value
      comboboxContext.onInputValueChange('')
    },
    [onClick, comboboxContext],
  )

  // Prevent pointer down from stealing focus from the input
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
    },
    [],
  )

  const state: ComboboxClear.State = React.useMemo(
    () => ({
      hasValue,
      disabled,
    }),
    [hasValue, disabled],
  )

  const element = useRender({
    render,
    ref: forwardedRef,
    state,
    props: {
      ...rest,
      [ComboboxClearDataAttributes.slot]: '',
      type: 'button',
      tabIndex: -1, // Not tabbable - use keyboard shortcuts instead
      'aria-label': 'Clear selection',
      disabled: disabled || !hasValue,
      className,
      style,
      onClick: handleClick,
      onPointerDown: handlePointerDown,
    },
    enabled: keepMounted || hasValue,
    defaultTagName: 'button',
  })

  // Don't render if no value and not keepMounted
  if (!keepMounted && !hasValue) {
    return null
  }

  return element
})

export namespace ComboboxClear {
  export type State = ComboboxClearState
  export interface Props extends ComboboxClearProps {}
}
