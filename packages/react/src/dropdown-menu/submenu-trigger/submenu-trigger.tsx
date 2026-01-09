'use client'

import { Popover } from '@base-ui/react/popover'
import * as React from 'react'
import { useSubmenuContext } from '../contexts/submenu-context.js'
import {
  useGroupContext,
  useSurfaceContext,
} from '../contexts/surface-context.js'

export interface DropdownMenuSubmenuTriggerProps
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
   * Whether to force render this item regardless of filter results.
   * @default false
   */
  forceMount?: boolean
}

/**
 * A menu item that opens a submenu when hovered.
 * Must be used within DropdownMenu.Submenu.
 * Renders a `<div>` element with role="menuitem" wrapped in Popover.Trigger.
 */
export const DropdownMenuSubmenuTrigger = React.forwardRef<
  HTMLDivElement,
  DropdownMenuSubmenuTriggerProps
>(function DropdownMenuSubmenuTrigger(props, forwardedRef) {
  const {
    value: valueProp,
    keywords,
    disabled = false,
    forceMount = false,
    onPointerDown,
    onPointerMove,
    onPointerEnter,
    onPointerLeave,
    children,
    ...rest
  } = props

  // Get parent menu's store (from Surface context)
  const { store: parentStore } = useSurfaceContext()
  const groupContext = useGroupContext()

  // Get submenu context for open state and refs
  const submenuContext = useSubmenuContext()
  const { open, setOpen, triggerRef } = submenuContext

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

  // Register item with parent store (as submenu trigger)
  React.useEffect(() => {
    if (!value && !forceMount) return

    const unregister = parentStore.registerItem(id, {
      value,
      keywords,
      groupId: groupContext?.groupId,
      disabled,
      isSubmenuTrigger: true,
    })

    return unregister
  }, [
    id,
    value,
    keywords,
    groupContext?.groupId,
    disabled,
    parentStore,
    forceMount,
  ])

  // Register submenu open callback with parent store
  React.useEffect(() => {
    return parentStore.registerSubmenuOpen(id, () => setOpen(true))
  }, [id, parentStore, setOpen])

  // Use selectors to get derived state from parent store
  const search = parentStore.useState('search')
  const isHighlighted = parentStore.useState('isHighlighted', id)
  const score = parentStore.useState('getItemScore', id)

  // Determine visibility based on filter score
  const hasSearch = search.length > 0
  const isVisible = forceMount || !hasSearch || score > 0

  // Scroll into view when highlighted via keyboard
  React.useEffect(() => {
    if (isHighlighted && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest' })
    }
  }, [isHighlighted])

  // Set the trigger ref when element mounts
  React.useEffect(() => {
    ;(triggerRef as React.MutableRefObject<HTMLElement | null>).current =
      ref.current
    return () => {
      ;(triggerRef as React.MutableRefObject<HTMLElement | null>).current = null
    }
  }, [triggerRef])

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Prevent focus from leaving the input
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
      parentStore.setHighlightedId(id)
    },
    [onPointerMove, disabled, parentStore, id],
  )

  const handlePointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerEnter?.(event)

      if (event.defaultPrevented) return
      if (disabled) return

      // Open submenu immediately on hover
      setOpen(true)
    },
    [onPointerEnter, disabled, setOpen],
  )

  const handlePointerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerLeave?.(event)

      if (event.defaultPrevented) return

      // Close submenu when pointer leaves trigger
      setOpen(false)
    },
    [onPointerLeave, setOpen],
  )

  // Don't render if not visible
  if (!isVisible) return null

  return (
    <Popover.Trigger
      render={
        <div
          ref={(node) => {
            // Merge refs
            ;(ref as React.MutableRefObject<HTMLDivElement | null>).current =
              node
            if (typeof forwardedRef === 'function') {
              forwardedRef(node)
            } else if (forwardedRef) {
              forwardedRef.current = node
            }
          }}
          {...rest}
          id={id}
          role="menuitem"
          aria-haspopup="menu"
          aria-expanded={open}
          // tabIndex for accessibility - focus stays on Input via aria-activedescendant
          tabIndex={-1}
          aria-disabled={disabled || undefined}
          data-submenu-trigger=""
          data-submenu-open={open ? '' : undefined}
          data-highlighted={isHighlighted ? '' : undefined}
          data-disabled={disabled ? '' : undefined}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          {children}
        </div>
      }
    />
  )
})

export namespace DropdownMenuSubmenuTrigger {
  export interface Props extends DropdownMenuSubmenuTriggerProps {}
}
