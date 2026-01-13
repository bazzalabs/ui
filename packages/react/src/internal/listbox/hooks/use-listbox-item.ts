'use client'

import * as React from 'react'
import { useGroupContext } from '../contexts/group-context.js'
import type { ItemContextValue } from '../contexts/item-context.js'
import { useListboxContext } from '../contexts/listbox-context.js'
import { useSurfaceContext } from '../contexts/surface-context.js'

/**
 * Aim guard refs for submenu navigation.
 * Optional - only needed for popup menus with submenus.
 */
export interface AimGuardRefs {
  /** Whether aim guard is currently active */
  aimGuardActiveRef: React.RefObject<boolean>
  /** The depth at which aim guard is active (null when not guarding) */
  guardedDepthRef: React.RefObject<number | null>
}

/**
 * Parameters for the useListboxItem hook.
 */
export interface UseListboxItemParams {
  /**
   * Unique value for this item used as identifier and for filtering.
   * If not provided, will be inferred from textContent.
   * This value serves as the unique key for the item in the store.
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

  /**
   * Keyboard shortcut to trigger this item.
   * When the menu is focused and the user presses this key, the item will be selected.
   * Should be a single character (e.g., "1", "a", etc.).
   */
  shortcut?: string

  /**
   * Whether this item is a submenu trigger (for store registration).
   * @default false
   */
  isSubmenuTrigger?: boolean

  /**
   * Callback when this item is selected (via click or Enter key).
   * For simple items, pass this directly. For checkbox/radio items,
   * use registerSelect() to register a dynamic handler.
   */
  onSelect?: () => void

  /**
   * Whether selecting this item should close the menu.
   * @default true
   */
  closeOnClick?: boolean

  /**
   * Callback invoked after selection occurs (via click).
   * Called with the item's ID. The consumer handles any
   * post-selection behavior like closing menus.
   */
  onAfterSelect?: (itemId: string) => void

  /**
   * Children (used for text content inference when value is not provided).
   */
  children?: React.ReactNode

  /**
   * Optional aim guard refs for popup menu navigation.
   * When provided, pointer move events will respect the aim guard.
   */
  aimGuard?: AimGuardRefs
}

/**
 * Return value from the useListboxItem hook.
 */
export interface UseListboxItemReturn {
  /** Unique ID for this item (DOM ID for aria-activedescendant) */
  id: string

  /**
   * Store identifier for this item.
   * Use this when calling store methods like setHighlightedId, registerSubmenuOpen, etc.
   * This is the `value` prop (or inferred from textContent).
   */
  storeId: string

  /** Ref to attach to the item element */
  ref: React.RefObject<HTMLDivElement | null>

  /** Whether item is currently highlighted */
  isHighlighted: boolean

  /** Whether item should be rendered (passes filter) */
  isVisible: boolean

  /** Context value to provide to children via ItemContext.Provider */
  contextValue: ItemContextValue

  /**
   * Event handlers to spread on the element.
   * These handle click, pointer move, and pointer down events.
   */
  handlers: {
    onClick: React.MouseEventHandler<HTMLDivElement>
    onPointerMove: React.PointerEventHandler<HTMLDivElement>
    onPointerDown: React.PointerEventHandler<HTMLDivElement>
  }

  /**
   * Register a custom onSelect handler.
   * This is useful for checkbox/radio items where the select behavior
   * needs to be customized (e.g., toggle checked state).
   * Returns an unregister function.
   */
  registerSelect: (handler: (() => void) | undefined) => () => void
}

/**
 * Hook that provides all shared logic for navigatable/highlightable listbox items.
 *
 * This hook handles:
 * - Item registration with the listbox store
 * - Highlight state management (keyboard and pointer)
 * - Filter/search visibility
 * - Scroll into view on keyboard navigation
 * - Click, pointer move, and pointer down event handlers
 * - Optional aim guard integration (for submenu navigation)
 *
 * @example
 * ```tsx
 * function CustomItem(props) {
 *   const item = useListboxItem({
 *     value: props.value,
 *     disabled: props.disabled,
 *     onSelect: props.onSelect,
 *   })
 *
 *   if (!item.isVisible) return null
 *
 *   return (
 *     <ItemContext.Provider value={item.contextValue}>
 *       <div
 *         ref={item.ref}
 *         {...item.handlers}
 *         data-highlighted={item.isHighlighted || undefined}
 *       >
 *         {props.children}
 *       </div>
 *     </ItemContext.Provider>
 *   )
 * }
 * ```
 */
export function useListboxItem(
  params: UseListboxItemParams,
): UseListboxItemReturn {
  const {
    value: valueProp,
    keywords,
    disabled = false,
    forceMount = false,
    shortcut,
    isSubmenuTrigger = false,
    onSelect,
    closeOnClick = true,
    onAfterSelect,
    children,
    aimGuard,
  } = params

  const { store } = useSurfaceContext()
  const groupContext = useGroupContext()
  const { depth } = useListboxContext()

  const ref = React.useRef<HTMLDivElement>(null)

  // Infer value from textContent if not provided
  const [inferredValue, setInferredValue] = React.useState<string>('')

  React.useLayoutEffect(() => {
    if (valueProp === undefined && ref.current) {
      const textContent = ref.current.textContent?.trim() ?? ''
      setInferredValue(textContent)
    }
  }, [valueProp, children])

  // Value serves as the unique identifier
  // When value is provided, use it directly
  // When inferred from textContent, use the inferred value
  const value = valueProp ?? inferredValue

  // Generate a stable ID for DOM id attribute (aria-activedescendant, etc.)
  // This is separate from the store identifier (value)
  const generatedDomId = React.useId()
  const domId = `item-${generatedDomId}`

  // Register item with store (using value as the unique identifier)
  React.useEffect(() => {
    if (!value && !forceMount) return

    const unregister = store.registerItem(value, {
      value,
      keywords,
      groupId: groupContext?.groupId,
      disabled,
      isSubmenuTrigger,
      shortcut,
      closeOnClick,
    })

    return unregister
  }, [
    value,
    keywords,
    groupContext?.groupId,
    disabled,
    isSubmenuTrigger,
    shortcut,
    closeOnClick,
    store,
    forceMount,
  ])

  // Register DOM ref with store for scroll behavior
  React.useEffect(() => {
    if (!value) return
    return store.registerItemRef(value, ref)
  }, [value, store])

  // Register onSelect handler if provided directly
  React.useEffect(() => {
    if (!onSelect || !value) return
    return store.registerItemSelect(value, onSelect)
  }, [value, onSelect, store])

  // Use selectors to get derived state (using value as identifier)
  const search = store.useState('search')
  const isHighlighted = store.useState('isHighlighted', value)
  const score = store.useState('getItemScore', value)

  // Determine visibility based on filter score
  const hasSearch = search.length > 0
  const isVisible = forceMount || !hasSearch || score > 0

  // Note: Scroll behavior is now handled by the store's setHighlightedId method.
  // It uses the registered DOM refs to call scrollIntoView when the element exists,
  // or falls back to onHighlightChange for virtualizer sync.

  // Event handlers
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return
      if (disabled) return
      if (!value) return

      event.preventDefault()

      // Call the registered onSelect handler via store
      const registeredHandler = store.context.itemSelects.get(value)
      registeredHandler?.()

      // Notify consumer that selection occurred (for closing menus, etc.)
      onAfterSelect?.(value)
    },
    [disabled, store, value, onAfterSelect],
  )

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
    },
    [],
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return
      if (disabled) return
      if (!value) return

      // Don't highlight if aim guard is active at this depth (user is moving toward submenu)
      // Only block highlighting in the same menu where the trigger is located
      if (aimGuard) {
        const { aimGuardActiveRef, guardedDepthRef } = aimGuard
        if (aimGuardActiveRef.current && guardedDepthRef.current === depth)
          return
      }

      // Highlight on hover (using value as identifier)
      store.setHighlightedId(value)
    },
    [disabled, aimGuard, depth, store, value],
  )

  // Context value for child components
  const contextValue: ItemContextValue = React.useMemo(
    () => ({
      id: domId,
      highlighted: isHighlighted,
      disabled,
      shortcut,
    }),
    [domId, isHighlighted, disabled, shortcut],
  )

  // Register a custom select handler (for checkbox/radio items)
  const registerSelect = React.useCallback(
    (handler: (() => void) | undefined) => {
      if (!value) return () => {}
      return store.registerItemSelect(value, handler)
    },
    [store, value],
  )

  const handlers = React.useMemo(
    () => ({
      onClick: handleClick,
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
    }),
    [handleClick, handlePointerMove, handlePointerDown],
  )

  return {
    id: domId,
    storeId: value,
    ref,
    isHighlighted,
    isVisible,
    contextValue,
    handlers,
    registerSelect,
  }
}
