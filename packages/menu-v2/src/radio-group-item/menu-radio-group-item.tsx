'use client'

import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
import { useId } from '@base-ui/utils/useId'
import { useMenuRootContext } from '../root/menu-root-context.js'
import { useMenuSurfaceContext } from '../surface/menu-surface-context.js'
import { useMenuRadioGroupContext } from '../radio-group/menu-radio-group-context.js'
import {
  MenuRadioGroupItemContext,
  type MenuRadioGroupItemContextValue,
} from './menu-radio-group-item-context.js'

/**
 * State for the MenuRadioGroupItem component
 */
export interface MenuRadioGroupItemState extends Record<string, unknown> {
  /** Whether the item is highlighted */
  highlighted: boolean
  /** Whether the item is disabled */
  disabled: boolean
  /** Whether the radio is checked */
  checked: boolean
}

/**
 * Props for the MenuRadioGroupItem component
 */
export interface MenuRadioGroupItemProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'className'> {
  /**
   * The content of the item.
   */
  children?: React.ReactNode
  /**
   * A function to customize the rendered element.
   */
  render?:
    | React.ReactElement
    | ((
        props: React.HTMLAttributes<HTMLDivElement>,
        state: MenuRadioGroupItemState,
      ) => React.ReactElement)
  /**
   * Class name or function that returns a class name based on state.
   */
  className?: string | ((state: MenuRadioGroupItemState) => string)
  /**
   * The value of this radio item. Must be unique within the group.
   */
  value: string
  /**
   * Whether the item is disabled.
   * @default false
   */
  disabled?: boolean
  /**
   * Whether to close the menu when this item is selected.
   * @default false
   */
  closeOnSelect?: boolean
  /**
   * The id of the item. Auto-generated if not provided.
   */
  id?: string
}

export namespace MenuRadioGroupItem {
  export type State = MenuRadioGroupItemState
  export type Props = MenuRadioGroupItemProps
}

/**
 * A radio menu item within a MenuRadioGroup.
 * Renders a `<div>` element with `role="menuitemradio"`.
 */
export const MenuRadioGroupItem = React.forwardRef<
  HTMLDivElement,
  MenuRadioGroupItem.Props
>(function MenuRadioGroupItem(props, forwardedRef) {
  const {
    children,
    render,
    className,
    value,
    disabled: disabledProp = false,
    closeOnSelect = false,
    id: idProp,
    ...otherProps
  } = props

  const { store } = useMenuRootContext()
  const { surfaceId } = useMenuSurfaceContext()
  const radioGroupContext = useMenuRadioGroupContext()

  const generatedId = React.useId()
  const id = useId(idProp) ?? generatedId

  // Determine if this item is disabled (either directly or via group)
  const disabled = disabledProp || radioGroupContext.disabled

  // Check if this item is checked
  const checked = radioGroupContext.value === value

  // Track if this item is highlighted
  const highlighted = store.useState('isActive', id)

  // Create a ref for this item
  const itemRef = React.useRef<HTMLDivElement | null>(null)

  // Register row on mount
  React.useEffect(() => {
    store.registerRow({
      id,
      ref: itemRef,
      disabled,
      surfaceId,
    })
    return () => {
      store.unregisterRow(id)
    }
  }, [store, id, disabled, surfaceId])

  // Handle select
  const handleSelect = React.useCallback(() => {
    if (disabled) return

    radioGroupContext.onValueChange(value)

    if (closeOnSelect) {
      store.setOpen(false)
    }
  }, [disabled, radioGroupContext, value, closeOnSelect, store])

  // Handle click
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) {
        event.preventDefault()
        return
      }
      handleSelect()
    },
    [disabled, handleSelect],
  )

  // Handle keyboard
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleSelect()
      }
    },
    [disabled, handleSelect],
  )

  // Handle pointer enter for highlighting
  const handlePointerEnter = React.useCallback(() => {
    if (!disabled) {
      store.setActiveId(surfaceId, id)
    }
  }, [store, surfaceId, id, disabled])

  // Prevent pointerdown from stealing focus from the input
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
    },
    [],
  )

  const state: MenuRadioGroupItem.State = React.useMemo(
    () => ({
      highlighted,
      disabled,
      checked,
    }),
    [highlighted, disabled, checked],
  )

  const contextValue = React.useMemo<MenuRadioGroupItemContextValue>(
    () => ({
      checked,
      disabled,
    }),
    [checked, disabled],
  )

  const resolvedClassName =
    typeof className === 'function' ? className(state) : className

  const element = useRender<MenuRadioGroupItemState, HTMLDivElement>({
    render: render as useRender.RenderProp<MenuRadioGroupItemState> | undefined,
    state,
    props: {
      ...otherProps,
      className: resolvedClassName,
      id,
      role: 'menuitemradio',
      tabIndex: -1,
      'aria-checked': checked,
      'aria-disabled': disabled || undefined,
      'data-highlighted': highlighted ? '' : undefined,
      'data-disabled': disabled ? '' : undefined,
      'data-state': checked ? 'checked' : 'unchecked',
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      onPointerDown: handlePointerDown,
      onPointerEnter: handlePointerEnter,
      children,
    },
    ref: (node: HTMLDivElement | null) => {
      itemRef.current = node
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
    },
    defaultTagName: 'div',
  })

  return (
    <MenuRadioGroupItemContext.Provider value={contextValue}>
      {element}
    </MenuRadioGroupItemContext.Provider>
  )
})

MenuRadioGroupItem.displayName = 'MenuRadioGroupItem'
