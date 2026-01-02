import * as React from 'react'
import { useMenu } from '../contexts/menu-context.js'
import { useSurface } from '../contexts/surface-context.js'
import { useRegisterNode } from '../contexts/collection-context.js'
import { extractTextContent, textToId } from '../utils/extract-text.js'

// ============================================================================
// Types
// ============================================================================

/**
 * Component state for Menu.Item.
 * These values are reflected as data attributes for styling.
 */
export interface ItemState {
  /**
   * Whether the item should ignore user interaction.
   * @cssattribute data-disabled
   */
  disabled: boolean
  /**
   * Whether the item is currently highlighted (focused).
   * @cssattribute data-highlighted
   */
  highlighted: boolean
}

/**
 * Props for the Menu.Item component.
 */
export interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
  /**
   * Unique identifier for this item.
   * Auto-generated from textValue if not provided.
   */
  id?: string
  /**
   * Text value for search/typeahead.
   * Auto-derived from children if not provided.
   */
  textValue?: string
  /**
   * Additional keywords for search matching.
   */
  keywords?: string[]
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean
  /**
   * Callback fired when the item is selected.
   */
  onSelect?: () => void
  /**
   * Whether to close the menu when the item is selected.
   * @default true
   */
  closeOnSelect?: boolean
}

// ============================================================================
// Component
// ============================================================================

/**
 * A selectable menu item.
 * Registers with the collection for keyboard navigation and search.
 * Renders a `<div>` element.
 *
 * Documentation: [Bazza UI Menu](https://bazza-ui.com/docs/components/dropdown-menu)
 *
 * @example
 * ```tsx
 * <Menu.Item onSelect={() => console.log('selected')}>
 *   Copy
 * </Menu.Item>
 *
 * <Menu.Item disabled>
 *   Paste (disabled)
 * </Menu.Item>
 *
 * <Menu.Item textValue="search-term" keywords={['alias']}>
 *   <Icon /> Label with icon
 * </Menu.Item>
 * ```
 */
export const MenuItem = React.forwardRef<HTMLDivElement, ItemProps>(
  function MenuItem(componentProps, forwardedRef) {
    const {
      id: providedId,
      textValue: providedTextValue,
      keywords,
      disabled = false,
      onSelect,
      closeOnSelect = true,
      children,
      onClick,
      onPointerDown,
      onPointerMove,
      onPointerEnter,
      onKeyDown,
      ...props
    } = componentProps
    const { actions, onSelect: rootOnSelect } = useMenu()
    const { searchState, highlightState, highlightActions } = useSurface()
    const elementRef = React.useRef<HTMLDivElement | null>(null)

    // Derive text value from children if not provided
    const textValue = providedTextValue ?? extractTextContent(children)

    // Generate ID from text value if not provided
    const id = providedId ?? textToId(textValue) ?? React.useId()

    // Whether this item is highlighted (surface-local)
    const isHighlighted = highlightState.highlightedId === id

    // Whether this item should be visible (based on search in this surface)
    const isInSearchResults =
      !searchState.searchMode ||
      searchState.searchResults.some((result) => result.node.id === id)

    // Compose refs
    const composedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
        elementRef.current = node
      },
      [forwardedRef],
    )

    // Register with collection
    useRegisterNode({
      id,
      kind: 'item',
      textValue,
      keywords,
      disabled,
      render: () => children,
      ref: elementRef,
    })

    // Compute component state
    const componentState: ItemState = React.useMemo(
      () => ({
        disabled,
        highlighted: isHighlighted,
      }),
      [disabled, isHighlighted],
    )

    // Scroll into view when highlighted via keyboard
    React.useEffect(() => {
      if (
        componentState.highlighted &&
        highlightState.activationCause === 'keyboard'
      ) {
        elementRef.current?.scrollIntoView({ block: 'nearest' })
      }
    }, [componentState.highlighted, highlightState.activationCause])

    // Handle selection
    const handleSelect = React.useCallback(() => {
      if (disabled) return

      onSelect?.()
      rootOnSelect?.(id)

      if (closeOnSelect) {
        actions.setOpen(false)
      }
    }, [disabled, onSelect, rootOnSelect, id, closeOnSelect, actions])

    // Event handlers
    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        handleSelect()
      },
      [onClick, handleSelect],
    )

    // Prevent focus from being stolen from the input when clicking an item
    const handlePointerDown = React.useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        onPointerDown?.(event)
        if (event.defaultPrevented) return
        event.preventDefault()
      },
      [onPointerDown],
    )

    const handlePointerMove = React.useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        onPointerMove?.(event)
        if (event.defaultPrevented || disabled) return
        // Only update if not already highlighted
        if (highlightState.highlightedId !== id) {
          highlightActions.setHighlightedId(id, 'pointer')
        }
      },
      [
        onPointerMove,
        disabled,
        highlightState.highlightedId,
        id,
        highlightActions,
      ],
    )

    const handlePointerEnter = React.useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        onPointerEnter?.(event)
        if (event.defaultPrevented || disabled) return
        // Only update if not already highlighted
        if (highlightState.highlightedId !== id) {
          highlightActions.setHighlightedId(id, 'pointer')
        }
      },
      [
        onPointerEnter,
        disabled,
        highlightState.highlightedId,
        id,
        highlightActions,
      ],
    )

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleSelect()
        }
      },
      [onKeyDown, handleSelect],
    )

    // Don't render if filtered out by search
    if (!isInSearchResults) {
      return null
    }

    return (
      <div
        ref={composedRef}
        role="menuitem"
        id={id}
        tabIndex={disabled ? undefined : -1}
        aria-disabled={componentState.disabled || undefined}
        data-highlighted={componentState.highlighted || undefined}
        data-disabled={componentState.disabled || undefined}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    )
  },
) as MenuItem

MenuItem.displayName = 'Menu.Item'

// ============================================================================
// Namespace
// ============================================================================

export interface MenuItem {
  (props: ItemProps & React.RefAttributes<HTMLDivElement>): React.JSX.Element
  displayName?: string
}

export namespace MenuItem {
  export type Props = ItemProps
  export type State = ItemState
}
