'use client'

import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
import {
  MenuRadioGroupContext,
  type MenuRadioGroupContextValue,
} from './menu-radio-group-context.js'

/**
 * State for the MenuRadioGroup component
 */
export interface MenuRadioGroupState extends Record<string, unknown> {
  /** Whether the group is disabled */
  disabled: boolean
}

/**
 * Props for the MenuRadioGroup component
 */
export interface MenuRadioGroupProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'className'> {
  /**
   * The content of the group.
   */
  children?: React.ReactNode
  /**
   * A function to customize the rendered element.
   */
  render?:
    | React.ReactElement
    | ((
        props: React.HTMLAttributes<HTMLDivElement>,
        state: MenuRadioGroupState,
      ) => React.ReactElement)
  /**
   * Class name or function that returns a class name based on state.
   */
  className?: string | ((state: MenuRadioGroupState) => string)
  /**
   * The current value of the radio group (controlled).
   */
  value?: string
  /**
   * The default value of the radio group (uncontrolled).
   */
  defaultValue?: string
  /**
   * Callback fired when the value changes.
   */
  onValueChange?: (value: string) => void
  /**
   * Whether the entire radio group is disabled.
   * @default false
   */
  disabled?: boolean
}

export namespace MenuRadioGroup {
  export type State = MenuRadioGroupState
  export type Props = MenuRadioGroupProps
}

/**
 * Groups radio menu items together.
 * Only one item within the group can be selected at a time.
 *
 * Renders a `<div>` element with `role="group"`.
 */
export const MenuRadioGroup = React.forwardRef<
  HTMLDivElement,
  MenuRadioGroup.Props
>(function MenuRadioGroup(props, forwardedRef) {
  const {
    children,
    render,
    className,
    value: valueProp,
    defaultValue,
    onValueChange,
    disabled = false,
    ...otherProps
  } = props

  // Handle controlled/uncontrolled value
  const [valueState, setValueState] = React.useState(defaultValue)
  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : valueState

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setValueState(newValue)
      }
      onValueChange?.(newValue)
    },
    [isControlled, onValueChange],
  )

  const state: MenuRadioGroup.State = React.useMemo(
    () => ({
      disabled,
    }),
    [disabled],
  )

  const contextValue = React.useMemo<MenuRadioGroupContextValue>(
    () => ({
      value,
      disabled,
      onValueChange: handleValueChange,
    }),
    [value, disabled, handleValueChange],
  )

  const resolvedClassName =
    typeof className === 'function' ? className(state) : className

  const element = useRender<MenuRadioGroupState, HTMLDivElement>({
    render: render as useRender.RenderProp<MenuRadioGroupState> | undefined,
    state,
    props: {
      ...otherProps,
      className: resolvedClassName,
      role: 'group',
      'data-disabled': disabled ? '' : undefined,
      children,
    },
    ref: forwardedRef,
    defaultTagName: 'div',
  })

  return (
    <MenuRadioGroupContext.Provider value={contextValue}>
      {element}
    </MenuRadioGroupContext.Provider>
  )
})

MenuRadioGroup.displayName = 'MenuRadioGroup'
