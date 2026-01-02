import * as React from 'react'
import { useMenu } from '../contexts/menu-context.js'
import { useSurface } from '../contexts/surface-context.js'
import { useRegisterNode } from '../contexts/collection-context.js'
import { extractTextContent, textToId } from '../utils/extract-text.js'

// ============================================================================
// Types
// ============================================================================

/**
 * Component state for Menu.CheckboxItem.
 * These values are reflected as data attributes for styling.
 */
export interface CheckboxItemState {
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
  /**
   * Whether the checkbox is currently checked.
   * @cssattribute data-checked
   */
  checked: boolean
}

/**
 * Props for the Menu.CheckboxItem component.
 */
export interface CheckboxItemProps
  extends React.ComponentPropsWithoutRef<'div'> {
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
   * Controlled checked state.
   */
  checked?: boolean
  /**
   * Default checked state for uncontrolled usage.
   * @default false
   */
  defaultChecked?: boolean
  /**
   * Callback fired when the checked state changes.
   */
  onCheckedChange?: (checked: boolean) => void
  /**
   * Whether to close the menu when the item is toggled.
   * @default false
   */
  closeOnSelect?: boolean
}

// ============================================================================
// Component
// ============================================================================

/**
 * A menu item with a checkbox that can be toggled.
 * Registers with the collection for keyboard navigation and search.
 * Renders a `<div>` element with `role="menuitemcheckbox"`.
 *
 * Documentation: [Bazza UI Menu](https://bazza-ui.com/docs/components/dropdown-menu)
 *
 * @example
 * ```tsx
 * const [showHidden, setShowHidden] = React.useState(false)
 *
 * <Menu.CheckboxItem
 *   checked={showHidden}
 *   onCheckedChange={setShowHidden}
 * >
 *   Show hidden files
 * </Menu.CheckboxItem>
 * ```
 */
export const MenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  CheckboxItemProps
>(function MenuCheckboxItem(componentProps, forwardedRef) {
  const {
    id: providedId,
    textValue: providedTextValue,
    keywords,
    disabled = false,
    checked: controlledChecked,
    defaultChecked = false,
    onCheckedChange,
    closeOnSelect = false,
    children,
    onClick,
    onPointerMove,
    onPointerEnter,
    onKeyDown,
    ...props
  } = componentProps
  const { actions } = useMenu()
  const { searchState, highlightState, highlightActions } = useSurface()
  const elementRef = React.useRef<HTMLDivElement | null>(null)

  // Controlled vs uncontrolled checked state
  const isControlled = controlledChecked !== undefined
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
  const checked = isControlled ? controlledChecked : internalChecked

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
    kind: 'checkbox-item',
    textValue,
    keywords,
    disabled,
    render: () => children,
    ref: elementRef,
  })

  // Compute component state
  const componentState: CheckboxItemState = React.useMemo(
    () => ({
      disabled,
      highlighted: isHighlighted,
      checked,
    }),
    [disabled, isHighlighted, checked],
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

  // Handle toggle
  const handleToggle = React.useCallback(() => {
    if (disabled) return

    const newChecked = !checked
    if (!isControlled) {
      setInternalChecked(newChecked)
    }
    onCheckedChange?.(newChecked)

    if (closeOnSelect) {
      actions.setOpen(false)
    }
  }, [disabled, checked, isControlled, onCheckedChange, closeOnSelect, actions])

  // Event handlers
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(event)
      if (event.defaultPrevented) return
      handleToggle()
    },
    [onClick, handleToggle],
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)
      if (event.defaultPrevented || disabled) return
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
        handleToggle()
      }
    },
    [onKeyDown, handleToggle],
  )

  // Don't render if filtered out by search
  if (!isInSearchResults) {
    return null
  }

  return (
    <div
      ref={composedRef}
      role="menuitemcheckbox"
      id={id}
      tabIndex={disabled ? undefined : -1}
      aria-checked={componentState.checked}
      aria-disabled={componentState.disabled || undefined}
      data-highlighted={componentState.highlighted || undefined}
      data-disabled={componentState.disabled || undefined}
      data-checked={componentState.checked || undefined}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  )
}) as MenuCheckboxItem

MenuCheckboxItem.displayName = 'Menu.CheckboxItem'

// ============================================================================
// Namespace
// ============================================================================

export interface MenuCheckboxItem {
  (
    props: CheckboxItemProps & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element
  displayName?: string
}

export namespace MenuCheckboxItem {
  export type Props = CheckboxItemProps
  export type State = CheckboxItemState
}
