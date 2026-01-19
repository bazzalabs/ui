'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { useItemContext } from '../../../listbox/index.js'
import { PopupMenuShortcutDataAttributes } from './shortcut.data-attrs.js'

export { PopupMenuShortcutDataAttributes }

/**
 * State for the Shortcut component, passed to children render function.
 */
export interface PopupMenuShortcutState extends Record<string, unknown> {
  /**
   * The keyboard shortcut value from the parent Item.
   */
  shortcut: string | undefined
  /**
   * Whether the parent item is highlighted.
   */
  highlighted: boolean
}

export interface PopupMenuShortcutProps
  extends Omit<ComponentProps<'kbd', PopupMenuShortcut.State>, 'children'> {
  /**
   * Content to render inside the shortcut.
   * Can be a render function that receives the shortcut value.
   * If not provided, renders the shortcut value from the parent Item.
   */
  children?:
    | React.ReactNode
    | ((state: PopupMenuShortcutState) => React.ReactNode)
}

const stateAttributesMapping = {
  highlighted: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuShortcutDataAttributes.highlighted]: '' } : null,
}

/**
 * Displays the keyboard shortcut for a menu item.
 * Must be used within a PopupMenu.Item component.
 * Renders a `<kbd>` element by default.
 *
 * @example
 * ```tsx
 * // Auto-renders the shortcut value
 * <PopupMenu.Item shortcut="1">
 *   Icebox
 *   <PopupMenu.Shortcut />
 * </PopupMenu.Item>
 *
 * // Custom rendering with children as function
 * <PopupMenu.Item shortcut="1">
 *   Icebox
 *   <PopupMenu.Shortcut>
 *     {({ shortcut }) => <span className="key">{shortcut}</span>}
 *   </PopupMenu.Shortcut>
 * </PopupMenu.Item>
 * ```
 */
export const PopupMenuShortcut = React.forwardRef<
  HTMLElement,
  PopupMenuShortcut.Props
>(function PopupMenuShortcut(props, forwardedRef) {
  const { children, render, className, style, ...rest } = props

  const { shortcut, highlighted } = useItemContext()

  const state: PopupMenuShortcut.State = React.useMemo(
    () => ({ shortcut, highlighted }),
    [shortcut, highlighted],
  )

  // Render children as function, custom children, or default to shortcut value
  const renderedChildren =
    typeof children === 'function' ? children(state) : (children ?? shortcut)

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      className,
      style,
      children: renderedChildren,
    },
    defaultTagName: 'kbd',
  })
})

export namespace PopupMenuShortcut {
  export type State = PopupMenuShortcutState
  export interface Props extends PopupMenuShortcutProps {}
}
