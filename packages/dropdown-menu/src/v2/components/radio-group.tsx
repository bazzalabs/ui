import * as React from 'react'
import { useMenu } from '../contexts/menu-context.js'
import { useSurface } from '../contexts/surface-context.js'
import { useRegisterNode } from '../contexts/collection-context.js'
import { extractTextContent, textToId } from '../utils/extract-text.js'

// ============================================================================
// Radio Group Context
// ============================================================================

interface RadioGroupContextValue {
  value: string | undefined
  onValueChange: (value: string) => void
  name: string
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(
  null,
)

function useRadioGroup() {
  const context = React.useContext(RadioGroupContext)
  if (!context) {
    throw new Error('Menu.RadioItem must be used within Menu.RadioGroup')
  }
  return context
}

// ============================================================================
// RadioGroup Types
// ============================================================================

/**
 * Props for the Menu.RadioGroup component.
 */
export interface RadioGroupProps extends React.ComponentPropsWithoutRef<'div'> {
  /**
   * Current selected value (controlled).
   */
  value?: string
  /**
   * Default selected value for uncontrolled usage.
   */
  defaultValue?: string
  /**
   * Callback fired when the selected value changes.
   */
  onValueChange?: (value: string) => void
  /**
   * Name for the radio group (for form submission).
   */
  name?: string
}

// ============================================================================
// RadioGroup Component
// ============================================================================

/**
 * Groups related radio items together.
 * Only one item can be selected at a time.
 * Renders a `<div>` element with `role="group"`.
 *
 * Documentation: [Bazza UI Menu](https://bazza-ui.com/docs/components/dropdown-menu)
 *
 * @example
 * ```tsx
 * const [sortBy, setSortBy] = React.useState('name')
 *
 * <Menu.RadioGroup value={sortBy} onValueChange={setSortBy}>
 *   <Menu.Label>Sort by</Menu.Label>
 *   <Menu.RadioItem value="name">Name</Menu.RadioItem>
 *   <Menu.RadioItem value="date">Date</Menu.RadioItem>
 *   <Menu.RadioItem value="size">Size</Menu.RadioItem>
 * </Menu.RadioGroup>
 * ```
 */
export const MenuRadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  function MenuRadioGroup(componentProps, forwardedRef) {
    const {
      value: controlledValue,
      defaultValue,
      onValueChange,
      name: providedName,
      children,
      ...props
    } = componentProps
    // Controlled vs uncontrolled value
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const value = isControlled ? controlledValue : internalValue

    // Generate name if not provided
    const generatedName = React.useId()
    const name = providedName ?? `radio-group-${generatedName}`

    // Handle value change
    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (!isControlled) {
          setInternalValue(newValue)
        }
        onValueChange?.(newValue)
      },
      [isControlled, onValueChange],
    )

    const contextValue = React.useMemo<RadioGroupContextValue>(
      () => ({
        value,
        onValueChange: handleValueChange,
        name,
      }),
      [value, handleValueChange, name],
    )

    return (
      <RadioGroupContext.Provider value={contextValue}>
        <div ref={forwardedRef} role="group" {...props}>
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  },
) as MenuRadioGroup

MenuRadioGroup.displayName = 'Menu.RadioGroup'

// ============================================================================
// RadioGroup Namespace
// ============================================================================

export interface MenuRadioGroup {
  (
    props: RadioGroupProps & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element
  displayName?: string
}

export namespace MenuRadioGroup {
  export type Props = RadioGroupProps
}

// ============================================================================
// RadioItem Types
// ============================================================================

/**
 * Component state for Menu.RadioItem.
 * These values are reflected as data attributes for styling.
 */
export interface RadioItemState {
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
   * Whether the radio item is currently checked.
   * @cssattribute data-checked
   */
  checked: boolean
}

/**
 * Props for the Menu.RadioItem component.
 */
export interface RadioItemProps extends React.ComponentPropsWithoutRef<'div'> {
  /**
   * Unique identifier for this item.
   * Auto-generated from textValue if not provided.
   */
  id?: string
  /**
   * Value for this radio item (required).
   */
  value: string
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
   * Whether to close the menu when the item is selected.
   * @default false
   */
  closeOnSelect?: boolean
}

// ============================================================================
// RadioItem Component
// ============================================================================

/**
 * A radio button menu item within a RadioGroup.
 * Renders a `<div>` element with `role="menuitemradio"`.
 *
 * Documentation: [Bazza UI Menu](https://bazza-ui.com/docs/components/dropdown-menu)
 *
 * @example
 * ```tsx
 * <Menu.RadioItem value="name">Name</Menu.RadioItem>
 * ```
 */
export const MenuRadioItem = React.forwardRef<HTMLDivElement, RadioItemProps>(
  function MenuRadioItem(componentProps, forwardedRef) {
    const {
      id: providedId,
      value,
      textValue: providedTextValue,
      keywords,
      disabled = false,
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
    const radioGroup = useRadioGroup()
    const elementRef = React.useRef<HTMLDivElement | null>(null)

    // Derive text value from children if not provided
    const textValue = providedTextValue ?? extractTextContent(children)

    // Generate ID from text value if not provided
    const id = providedId ?? textToId(textValue) ?? React.useId()

    // Whether this item is highlighted (surface-local) and checked
    const isHighlighted = highlightState.highlightedId === id
    const isChecked = radioGroup.value === value

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
      kind: 'radio-item',
      textValue,
      keywords,
      disabled,
      render: () => children,
      ref: elementRef,
    })

    // Compute component state
    const componentState: RadioItemState = React.useMemo(
      () => ({
        disabled,
        highlighted: isHighlighted,
        checked: isChecked,
      }),
      [disabled, isHighlighted, isChecked],
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

      radioGroup.onValueChange(value)

      if (closeOnSelect) {
        actions.setOpen(false)
      }
    }, [disabled, radioGroup, value, closeOnSelect, actions])

    // Event handlers
    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        handleSelect()
      },
      [onClick, handleSelect],
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
        role="menuitemradio"
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
  },
) as MenuRadioItem

MenuRadioItem.displayName = 'Menu.RadioItem'

// ============================================================================
// RadioItem Namespace
// ============================================================================

export interface MenuRadioItem {
  (
    props: RadioItemProps & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element
  displayName?: string
}

export namespace MenuRadioItem {
  export type Props = RadioItemProps
  export type State = RadioItemState
}
