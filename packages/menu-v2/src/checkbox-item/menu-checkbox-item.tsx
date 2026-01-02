'use client'

import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
import { useId } from '@base-ui/utils/useId'
import { useMenuRootContext } from '../root/menu-root-context.js'
import { useMenuSurfaceContext } from '../surface/menu-surface-context.js'
import {
  MenuCheckboxItemContext,
  type MenuCheckboxItemContextValue,
} from './menu-checkbox-item-context.js'

/**
 * State for the MenuCheckboxItem component
 */
export interface MenuCheckboxItemState extends Record<string, unknown> {
  /** Whether the item is highlighted */
  highlighted: boolean
  /** Whether the item is disabled */
  disabled: boolean
  /** Whether the checkbox is checked */
  checked: boolean
}

/**
 * Props for the MenuCheckboxItem component
 */
export interface MenuCheckboxItemProps
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
        state: MenuCheckboxItemState,
      ) => React.ReactElement)
  /**
   * Class name or function that returns a class name based on state.
   */
  className?: string | ((state: MenuCheckboxItemState) => string)
  /**
   * Whether the item is disabled.
   * @default false
   */
  disabled?: boolean
  /**
   * Whether the checkbox is checked.
   */
  checked?: boolean
  /**
   * The default checked state (uncontrolled).
   * @default false
   */
  defaultChecked?: boolean
  /**
   * Callback fired when the checked state changes.
   */
  onCheckedChange?: (checked: boolean) => void
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

export namespace MenuCheckboxItem {
  export type State = MenuCheckboxItemState
  export type Props = MenuCheckboxItemProps
}

/**
 * A menu item with a checkbox.
 * Renders a `<div>` element with `role="menuitemcheckbox"`.
 */
export const MenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  MenuCheckboxItem.Props
>(function MenuCheckboxItem(props, forwardedRef) {
  const {
    children,
    render,
    className,
    disabled = false,
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    closeOnSelect = false,
    id: idProp,
    ...otherProps
  } = props

  const { store } = useMenuRootContext()
  const { surfaceId } = useMenuSurfaceContext()

  const generatedId = React.useId()
  const id = useId(idProp) ?? generatedId

  // Handle controlled/uncontrolled checked state
  const [checkedState, setCheckedState] = React.useState(defaultChecked)
  const isControlled = checkedProp !== undefined
  const checked = isControlled ? checkedProp : checkedState

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

  // Handle toggle
  const handleToggle = React.useCallback(() => {
    if (disabled) return

    const newChecked = !checked
    if (!isControlled) {
      setCheckedState(newChecked)
    }
    onCheckedChange?.(newChecked)

    if (closeOnSelect) {
      store.setOpen(false)
    }
  }, [disabled, checked, isControlled, onCheckedChange, closeOnSelect, store])

  // Handle click
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) {
        event.preventDefault()
        return
      }
      handleToggle()
    },
    [disabled, handleToggle],
  )

  // Handle keyboard
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleToggle()
      }
    },
    [disabled, handleToggle],
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

  const state: MenuCheckboxItem.State = React.useMemo(
    () => ({
      highlighted,
      disabled,
      checked,
    }),
    [highlighted, disabled, checked],
  )

  const contextValue = React.useMemo<MenuCheckboxItemContextValue>(
    () => ({
      checked,
      disabled,
    }),
    [checked, disabled],
  )

  const resolvedClassName =
    typeof className === 'function' ? className(state) : className

  const element = useRender<MenuCheckboxItemState, HTMLDivElement>({
    render: render as useRender.RenderProp<MenuCheckboxItemState> | undefined,
    state,
    props: {
      ...otherProps,
      className: resolvedClassName,
      id,
      role: 'menuitemcheckbox',
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
    <MenuCheckboxItemContext.Provider value={contextValue}>
      {element}
    </MenuCheckboxItemContext.Provider>
  )
})

MenuCheckboxItem.displayName = 'MenuCheckboxItem'
