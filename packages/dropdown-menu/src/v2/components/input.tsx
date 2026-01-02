import * as React from 'react'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import { useMenu } from '../contexts/menu-context.js'
import { useSurface } from '../contexts/surface-context.js'
import { useCollection } from '../contexts/collection-context.js'
import { searchNodes } from '../utils/scoring.js'

// ============================================================================
// Types
// ============================================================================

export interface InputProps
  extends Omit<
    React.ComponentPropsWithoutRef<'input'>,
    'type' | 'value' | 'onChange' | 'defaultValue'
  > {
  /**
   * Hide the input until search is activated via keyboard.
   * When true, the input is visually hidden but still functional.
   * Typing any character will show the input and focus it.
   */
  hideUntilActive?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Controlled value */
  value?: string
  /** Default value for uncontrolled usage */
  defaultValue?: string
  /** Callback when value changes */
  onValueChange?: (value: string) => void
  /** Whether to enable deep search across submenus */
  deepSearch?: boolean
}

// ============================================================================
// Component
// ============================================================================

/**
 * Search input for filtering menu items.
 * Supports both always-visible and hide-until-active modes.
 *
 * @example
 * ```tsx
 * // Always visible search
 * <Menu.Surface>
 *   <Menu.Input placeholder="Search..." />
 *   <Menu.Item>Item 1</Menu.Item>
 *   <Menu.Item>Item 2</Menu.Item>
 * </Menu.Surface>
 *
 * // Hidden until typing starts
 * <Menu.Surface>
 *   <Menu.Input hideUntilActive placeholder="Type to search..." />
 *   <Menu.Item>Item 1</Menu.Item>
 *   <Menu.Item>Item 2</Menu.Item>
 * </Menu.Surface>
 * ```
 */
export const MenuInput = React.forwardRef<HTMLInputElement, InputProps>(
  function MenuInput(
    {
      hideUntilActive = false,
      placeholder = 'Search...',
      value: controlledValue,
      defaultValue = '',
      onValueChange,
      deepSearch = true,
      onKeyDown,
      onFocus,
      onBlur,
      className,
      style,
      ...props
    },
    forwardedRef,
  ) {
    // Get surface-local search state (independent per Menu.Surface)
    const { searchState, searchActions, focusActions } = useSurface()
    // Menu context is still needed for closing the menu on escape
    const { actions: menuActions } = useMenu()
    const { actions: collectionActions } = useCollection()
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const [isFocused, setIsFocused] = React.useState(false)

    // Use controllable state for the input value
    const [value = '', setValue] = useControllableState({
      prop: controlledValue,
      defaultProp: defaultValue,
      onChange: onValueChange,
    })

    // Sync internal value with surface search state
    React.useEffect(() => {
      // Perform search if deep search is enabled
      let results: ReturnType<typeof searchNodes> = []
      if (deepSearch && value) {
        const searchableNodes = collectionActions.getSearchableNodes()
        results = searchNodes(
          searchableNodes,
          value,
          collectionActions.getSubmenuLabel,
        )
      }

      // Update surface search state
      searchActions.setSearchQuery(value)
      searchActions.setSearchResults(results)
    }, [value, deepSearch, collectionActions, searchActions])

    // Register this input ref with the surface for focus management
    React.useEffect(() => {
      focusActions.registerInput(inputRef)
    }, [focusActions])

    // Compose refs
    const composedRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
        inputRef.current = node
      },
      [forwardedRef],
    )

    // Whether input should be visible
    const isVisible = !hideUntilActive || searchState.searchActive || isFocused

    // Handle input change
    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value)
      },
      [setValue],
    )

    // Handle key down
    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return

        // Let arrow keys pass through to Surface for navigation
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          // Don't prevent default - let it bubble up
          return
        }

        // Escape clears search or closes menu
        if (event.key === 'Escape') {
          if (searchState.searchQuery) {
            event.preventDefault()
            event.stopPropagation()
            searchActions.clearSearch()
          }
          // If no search query, let escape bubble to close menu
        }

        // Enter selects highlighted item
        if (event.key === 'Enter') {
          // Let it bubble to Surface which handles selection
        }
      },
      [onKeyDown, searchState.searchQuery, searchActions],
    )

    // Handle focus
    const handleFocus = React.useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        onFocus?.(event)
        setIsFocused(true)
      },
      [onFocus],
    )

    // Handle blur
    const handleBlur = React.useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        onBlur?.(event)
        setIsFocused(false)
      },
      [onBlur],
    )

    // Auto-focus when search becomes active (keyboard typing activated it)
    React.useEffect(() => {
      if (hideUntilActive && searchState.searchActive && inputRef.current) {
        inputRef.current.focus()
      }
    }, [hideUntilActive, searchState.searchActive])

    // Computed styles for hide-until-active mode
    const hiddenStyle: React.CSSProperties =
      hideUntilActive && !isVisible
        ? {
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }
        : {}

    return (
      <input
        ref={composedRef}
        type="text"
        role="searchbox"
        aria-label="Search menu items"
        aria-controls={undefined} // Could be set to listbox ID if using one
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={className}
        style={{ ...hiddenStyle, ...style }}
        data-search-active={searchState.searchActive || undefined}
        data-hidden={(hideUntilActive && !isVisible) || undefined}
        {...props}
      />
    )
  },
) as MenuInput

MenuInput.displayName = 'Menu.Input'

// ============================================================================
// Namespace
// ============================================================================

export interface MenuInput {
  (props: InputProps & React.RefAttributes<HTMLInputElement>): React.JSX.Element
  displayName?: string
}

export namespace MenuInput {
  export type Props = InputProps
}
