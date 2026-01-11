'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useItemContext } from '../item/item-context.js'

/**
 * State for the Shortcut component, passed to children render function.
 */
export interface DropdownMenuShortcutState extends Record<string, unknown> {
  /**
   * The keyboard shortcut value from the parent Item.
   */
  shortcut: string | undefined
}

export interface DropdownMenuShortcutProps
  extends Omit<ComponentProps<'kbd', DropdownMenuShortcutState>, 'children'> {
  /**
   * Content to render inside the shortcut.
   * Can be a render function that receives the shortcut value.
   * If not provided, renders the shortcut value from the parent Item.
   */
  children?:
    | React.ReactNode
    | ((state: DropdownMenuShortcutState) => React.ReactNode)
}

/**
 * Displays the keyboard shortcut for a menu item.
 * Must be used within a DropdownMenu.Item component.
 * Renders a `<kbd>` element by default.
 *
 * @example
 * ```tsx
 * // Auto-renders the shortcut value
 * <DropdownMenu.Item shortcut="1">
 *   Icebox
 *   <DropdownMenu.Shortcut />
 * </DropdownMenu.Item>
 *
 * // Custom rendering with children as function
 * <DropdownMenu.Item shortcut="1">
 *   Icebox
 *   <DropdownMenu.Shortcut>
 *     {({ shortcut }) => <span className="key">{shortcut}</span>}
 *   </DropdownMenu.Shortcut>
 * </DropdownMenu.Item>
 * ```
 */
export const DropdownMenuShortcut = React.forwardRef<
  HTMLElement,
  DropdownMenuShortcutProps
>(function DropdownMenuShortcut(props, forwardedRef) {
  const { children, render, className, style, ...rest } = props

  const { shortcut } = useItemContext()

  const state: DropdownMenuShortcutState = React.useMemo(
    () => ({ shortcut }),
    [shortcut],
  )

  // Render children as function, custom children, or default to shortcut value
  const renderedChildren =
    typeof children === 'function' ? children(state) : (children ?? shortcut)

  return useRender({
    render,
    ref: forwardedRef,
    state,
    props: {
      ...rest,
      className,
      style,
      children: renderedChildren,
    },
    defaultTagName: 'kbd',
  })
})

export namespace DropdownMenuShortcut {
  export type State = DropdownMenuShortcutState
  export interface Props extends DropdownMenuShortcutProps {}
}
