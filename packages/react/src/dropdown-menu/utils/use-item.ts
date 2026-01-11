'use client'

import * as React from 'react'
import { useAimGuard } from '../contexts/aim-guard-context.js'
import type { ItemContextValue } from '../contexts/item-context.js'
import { useRootContext } from '../contexts/root-context.js'
import {
  useGroupContext,
  useSurfaceContext,
} from '../contexts/surface-context.js'

/**
 * Parameters for the useItem hook.
 */
export interface UseItemParams {
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
   * Whether clicking this item should close the menu.
   * @default true
   */
  closeOnClick?: boolean

  /**
   * Children (used for text content inference when value is not provided).
   */
  children?: React.ReactNode
}

/**
 * Return value from the useItem hook.
 */
export interface UseItemReturn {
  /** Unique ID for this item */
  id: string

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
 * Hook that provides all shared logic for navigatable/highlightable menu items.
 *
 * This hook handles:
 * - Item registration with the dropdown menu store
 * - Highlight state management (keyboard and pointer)
 * - Filter/search visibility
 * - Scroll into view on keyboard navigation
 * - Click, pointer move, and pointer down event handlers
 * - Aim guard integration (for submenu navigation)
 *
 * @example
 * ```tsx
 * function CustomItem(props) {
 *   const item = useItem({
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
export function useItem(params: UseItemParams): UseItemReturn {
  const {
    value: valueProp,
    keywords,
    disabled = false,
    forceMount = false,
    shortcut,
    isSubmenuTrigger = false,
    onSelect,
    closeOnClick = true,
    children,
  } = params

  const { store } = useSurfaceContext()
  const groupContext = useGroupContext()
  const { depth, closeAll } = useRootContext()
  const { aimGuardActiveRef, guardedDepthRef } = useAimGuard()

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
      isSubmenuTrigger,
      shortcut,
    })

    return unregister
  }, [
    id,
    value,
    keywords,
    groupContext?.groupId,
    disabled,
    isSubmenuTrigger,
    shortcut,
    store,
    forceMount,
  ])

  // Register onSelect handler if provided directly
  React.useEffect(() => {
    if (!onSelect) return
    return store.registerItemSelect(id, onSelect)
  }, [id, onSelect, store])

  // Use selectors to get derived state
  const search = store.useState('search')
  const isHighlighted = store.useState('isHighlighted', id)
  const score = store.useState('getItemScore', id)

  // Determine visibility based on filter score
  const hasSearch = search.length > 0
  const isVisible = forceMount || !hasSearch || score > 0

  // Scroll into view only when highlighted via keyboard
  React.useEffect(() => {
    if (
      isHighlighted &&
      store.state.highlightSource === 'keyboard' &&
      ref.current
    ) {
      ref.current.scrollIntoView({ block: 'nearest' })
    }
  }, [isHighlighted, store])

  // Event handlers
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return
      if (disabled) return

      event.preventDefault()

      // Call the registered onSelect handler via store
      const registeredHandler = store.context.itemSelects.get(id)
      registeredHandler?.()

      if (closeOnClick) {
        closeAll()
      }
    },
    [disabled, store, id, closeOnClick, closeAll],
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

      // Don't highlight if aim guard is active at this depth (user is moving toward submenu)
      // Only block highlighting in the same menu where the trigger is located
      if (aimGuardActiveRef.current && guardedDepthRef.current === depth) return

      // Highlight on hover
      store.setHighlightedId(id)
    },
    [disabled, aimGuardActiveRef, guardedDepthRef, depth, store, id],
  )

  // Context value for child components
  const contextValue: ItemContextValue = React.useMemo(
    () => ({
      id,
      highlighted: isHighlighted,
      disabled,
      shortcut,
    }),
    [id, isHighlighted, disabled, shortcut],
  )

  // Register a custom select handler (for checkbox/radio items)
  const registerSelect = React.useCallback(
    (handler: (() => void) | undefined) => {
      return store.registerItemSelect(id, handler)
    },
    [store, id],
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
    id,
    ref,
    isHighlighted,
    isVisible,
    contextValue,
    handlers,
    registerSelect,
  }
}
