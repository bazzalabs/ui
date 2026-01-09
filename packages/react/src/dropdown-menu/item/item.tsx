'use client'

import * as React from 'react'
import {
  useGroupContext,
  useSurfaceContext,
} from '../contexts/surface-context.js'

export interface DropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<'div'> {
  /**
   * Unique value for this item used for filtering.
   * If not provided, will be inferred from textContent.
   */
  value?: string

  /**
   * Additional keywords to match against when filtering.
   * Useful for aliases or synonyms.
   */
  keywords?: string[]

  /**
   * Whether this item is disabled.
   * Disabled items are not selectable and are skipped during keyboard navigation.
   */
  disabled?: boolean

  /**
   * Callback when this item is selected (via click or Enter key).
   */
  onSelect?: () => void

  /**
   * Whether to force render this item regardless of filter results.
   * @default false
   */
  forceMount?: boolean
}

/**
 * A selectable item in the dropdown menu.
 * Renders a `<div>` element with role="option".
 */
export const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps
>(function DropdownMenuItem(props, forwardedRef) {
  const {
    value: valueProp,
    keywords,
    disabled = false,
    onSelect,
    forceMount = false,
    onClick,
    onPointerDown,
    onPointerMove,
    children,
    ...rest
  } = props

  const { store } = useSurfaceContext()
  const groupContext = useGroupContext()

  const id = React.useId()
  const ref = React.useRef<HTMLDivElement>(null)

  // Infer value from textContent if not provided
  const [inferredValue, setInferredValue] = React.useState<string>('')

  React.useLayoutEffect(() => {
    if (valueProp === undefined && ref.current) {
      const textContent = ref.current.textContent?.trim() ?? ''
      setInferredValue(textContent)
    }
  }, [valueProp, children])

  const value = valueProp ?? inferredValue

  // Register item with store
  React.useEffect(() => {
    if (!value && !forceMount) return

    const unregister = store.registerItem(id, {
      value,
      keywords,
      groupId: groupContext?.groupId,
      disabled,
    })

    return unregister
  }, [id, value, keywords, groupContext?.groupId, disabled, store, forceMount])

  // Register onSelect handler
  React.useEffect(() => {
    return store.registerItemSelect(id, onSelect)
  }, [id, onSelect, store])

  // Use selectors to get derived state
  const search = store.useState('search')
  const isHighlighted = store.useState('isHighlighted', id)
  const score = store.useState('getItemScore', id)

  // Determine visibility based on filter score
  const hasSearch = search.length > 0
  const isVisible = forceMount || !hasSearch || score > 0

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(event)

      if (event.defaultPrevented) return
      if (disabled) return

      event.preventDefault()
      onSelect?.()
    },
    [onClick, disabled, onSelect],
  )

  const handlerPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      onPointerDown?.(event)
    },
    [onPointerDown],
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)

      if (event.defaultPrevented) return
      if (disabled) return

      // Highlight on hover
      store.setHighlightedId(id)
    },
    [onPointerMove, disabled, store, id],
  )

  // Don't render if not visible
  if (!isVisible) return null

  return (
    <div
      ref={(node) => {
        // Merge refs
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      }}
      {...rest}
      id={id}
      role="option"
      // tabIndex for accessibility - focus stays on Input via aria-activedescendant
      tabIndex={-1}
      aria-selected={isHighlighted}
      aria-disabled={disabled || undefined}
      data-highlighted={isHighlighted ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerDown={handlerPointerDown}
    >
      {children}
    </div>
  )
})

export namespace DropdownMenuItem {
  export interface Props extends DropdownMenuItemProps {}
}
