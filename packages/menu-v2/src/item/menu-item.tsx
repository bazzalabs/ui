'use client'

import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
import { useId } from '@base-ui/utils/useId'
import { useMenuRootContext } from '../root/menu-root-context.js'
import { useMenuSurfaceContext } from '../surface/menu-surface-context.js'

/**
 * State for the MenuItem component
 */
export interface MenuItemState extends Record<string, unknown> {
  /** Whether the item is highlighted */
  highlighted: boolean
  /** Whether the item is disabled */
  disabled: boolean
}

/**
 * Props for the MenuItem component
 */
export interface MenuItemProps
  extends Omit<React.ComponentPropsWithRef<'div'>, 'className' | 'onSelect'> {
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
        state: MenuItemState,
      ) => React.ReactElement)
  /**
   * Class name or function that returns a class name based on state.
   */
  className?: string | ((state: MenuItemState) => string)
  /**
   * Whether the item is disabled.
   * @default false
   */
  disabled?: boolean
  /**
   * Callback fired when the item is selected (clicked or Enter pressed).
   */
  onSelect?: () => void
  /**
   * Whether to close the menu when this item is selected.
   * @default true
   */
  closeOnSelect?: boolean
  /**
   * The id of the item. Auto-generated if not provided.
   */
  id?: string
}

export namespace MenuItem {
  export type State = MenuItemState
  export type Props = MenuItemProps
}

/**
 * An individual interactive item in the menu.
 * Renders a `<div>` element with `role="option"`.
 */
export const MenuItem = React.forwardRef<HTMLDivElement, MenuItem.Props>(
  function MenuItem(props, forwardedRef) {
    const {
      children,
      render,
      className,
      disabled = false,
      onSelect,
      closeOnSelect = true,
      id: idProp,
      ...otherProps
    } = props

    const { store } = useMenuRootContext()
    const { surfaceId } = useMenuSurfaceContext()

    const generatedId = React.useId()
    const id = useId(idProp) ?? generatedId

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

    // Handle selection
    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) {
          event.preventDefault()
          return
        }

        onSelect?.()

        if (closeOnSelect) {
          store.setOpen(false)
        }
      },
      [disabled, onSelect, closeOnSelect, store],
    )

    // Handle keyboard selection
    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (disabled) return

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect?.()

          if (closeOnSelect) {
            store.setOpen(false)
          }
        }
      },
      [disabled, onSelect, closeOnSelect, store],
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

    const state: MenuItem.State = React.useMemo(
      () => ({
        highlighted,
        disabled,
      }),
      [highlighted, disabled],
    )

    const resolvedClassName =
      typeof className === 'function' ? className(state) : className

    const element = useRender<MenuItemState, HTMLDivElement>({
      render: render as useRender.RenderProp<MenuItemState> | undefined,
      state,
      props: {
        ...otherProps,
        className: resolvedClassName,
        id,
        role: 'option',
        tabIndex: -1,
        'aria-selected': highlighted,
        'aria-disabled': disabled || undefined,
        'data-highlighted': highlighted ? '' : undefined,
        'data-disabled': disabled ? '' : undefined,
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

    return element
  },
)

MenuItem.displayName = 'MenuItem'
