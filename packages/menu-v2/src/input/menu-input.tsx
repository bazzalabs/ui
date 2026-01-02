'use client'

import * as React from 'react'
import { useRender } from '@base-ui/react/use-render'
import { useMenuRootContext } from '../root/menu-root-context.js'
import { useMenuSurfaceContext } from '../surface/menu-surface-context.js'

/**
 * State for the MenuInput component
 */
export interface MenuInputState extends Record<string, unknown> {
  /** Whether the input has a value */
  hasValue: boolean
}

/**
 * Props for the MenuInput component
 */
export interface MenuInputProps
  extends Omit<React.ComponentPropsWithRef<'input'>, 'className' | 'type'> {
  /**
   * A function to customize the rendered element.
   */
  render?:
    | React.ReactElement
    | ((
        props: React.InputHTMLAttributes<HTMLInputElement>,
        state: MenuInputState,
      ) => React.ReactElement)
  /**
   * Class name or function that returns a class name based on state.
   */
  className?: string | ((state: MenuInputState) => string)
}

export namespace MenuInput {
  export type State = MenuInputState
  export type Props = MenuInputProps
}

/**
 * Search input for filtering menu items.
 * Uses the combobox pattern with aria-activedescendant.
 *
 * Renders an `<input>` element with `role="combobox"`.
 */
export const MenuInput = React.forwardRef<HTMLInputElement, MenuInput.Props>(
  function MenuInput(props, forwardedRef) {
    const { render, className, onChange, onKeyDown, ...otherProps } = props

    const { store } = useMenuRootContext()
    const { listId, surfaceId } = useMenuSurfaceContext()

    // Get state from store
    const query = store.useState('query')
    const open = store.useState('open')
    const activeId = store.useState('activeId', surfaceId)
    const direction = store.useState('direction')
    const vimBindings = store.useState('vimBindings')

    // Create a ref for the input
    const inputRef = React.useRef<HTMLInputElement | null>(null)

    // Store the input ref in context
    React.useEffect(() => {
      const contextRef = store.context.inputRef
      if (contextRef && 'current' in contextRef) {
        ;(
          contextRef as React.MutableRefObject<HTMLInputElement | null>
        ).current = inputRef.current
      }
    }, [store.context.inputRef])

    // Handle input change
    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        store.setQuery(event.target.value)
        onChange?.(event)
      },
      [store, onChange],
    )

    // Handle keyboard navigation
    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        const { key, ctrlKey } = event

        // Vim bindings
        if (vimBindings && ctrlKey) {
          if (key === 'n' || key === 'j') {
            event.preventDefault()
            store.next(surfaceId)
            return
          }
          if (key === 'p' || key === 'k') {
            event.preventDefault()
            store.prev(surfaceId)
            return
          }
        }

        // Standard navigation
        switch (key) {
          case 'ArrowDown':
            event.preventDefault()
            store.next(surfaceId)
            break
          case 'ArrowUp':
            event.preventDefault()
            store.prev(surfaceId)
            break
          case 'Home':
          case 'PageUp':
            event.preventDefault()
            store.first(surfaceId)
            break
          case 'End':
          case 'PageDown':
            event.preventDefault()
            store.last(surfaceId)
            break
          case 'Enter':
            event.preventDefault()
            // Trigger click on active item
            if (activeId) {
              const row = store.state.rows.get(activeId)
              row?.ref.current?.click()
            }
            break
          case 'Escape':
            event.preventDefault()
            store.setOpen(false)
            break
          case 'ArrowRight':
            // Open submenu (LTR)
            if (direction === 'ltr') {
              // TODO: Handle submenu opening
            }
            break
          case 'ArrowLeft':
            // Close submenu or go back (LTR)
            if (direction === 'ltr') {
              // TODO: Handle submenu closing
            }
            break
        }

        onKeyDown?.(event)
      },
      [store, surfaceId, activeId, direction, vimBindings, onKeyDown],
    )

    const state: MenuInput.State = React.useMemo(
      () => ({
        hasValue: query.length > 0,
      }),
      [query],
    )

    const resolvedClassName =
      typeof className === 'function' ? className(state) : className

    const element = useRender<MenuInputState, HTMLInputElement>({
      render: render as useRender.RenderProp<MenuInputState> | undefined,
      state,
      props: {
        ...otherProps,
        className: resolvedClassName,
        type: 'text',
        role: 'combobox',
        'aria-autocomplete': 'list',
        'aria-expanded': open,
        'aria-controls': listId,
        'aria-activedescendant': activeId ?? undefined,
        value: query,
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        'data-has-value': query.length > 0 ? '' : undefined,
      },
      ref: (node: HTMLInputElement | null) => {
        inputRef.current = node
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      defaultTagName: 'input',
    })

    return element
  },
)

MenuInput.displayName = 'MenuInput'
