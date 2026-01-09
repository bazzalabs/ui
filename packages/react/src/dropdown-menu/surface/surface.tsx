'use client'

import { useRender } from '@base-ui/react/use-render'
import { useStableCallback } from '@base-ui/utils/useStableCallback'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useFocusOwner } from '../contexts/focus-owner-context.js'
import { useRootContext } from '../contexts/root-context.js'
import { useMaybeSubmenuContext } from '../contexts/submenu-context.js'
import { type FilterFn, SurfaceContext } from '../contexts/surface-context.js'
import { defaultFilter } from '../utils/command-score.js'

// Surface doesn't expose data attributes - using empty state
export interface DropdownMenuSurfaceState extends Record<string, unknown> {}

export interface DropdownMenuSurfaceProps
  extends ComponentProps<'div', DropdownMenuSurfaceState> {
  /**
   * Filter function for matching items against search query.
   * Returns a score between 0 and 1 (0 = no match, > 0 = match).
   * Pass `false` to disable filtering entirely.
   * @default commandScore (fuzzy matching)
   */
  filter?: FilterFn | false

  /**
   * Controlled search value.
   */
  search?: string

  /**
   * Callback when search value changes.
   */
  onSearchChange?: (search: string) => void

  /**
   * Default search value for uncontrolled usage.
   * @default ''
   */
  defaultSearch?: string

  /**
   * Whether navigation should loop from last to first item and vice versa.
   * @default true
   */
  loop?: boolean

  /**
   * Whether to automatically highlight the first item when the menu opens
   * or when search results change.
   * @default true
   */
  autoHighlightFirst?: boolean

  /**
   * Whether to clear the search query when the menu closes.
   * @default true
   */
  clearSearchOnClose?: boolean

  children: React.ReactNode
}

/**
 * Provides search context and manages item registration for dropdown menu.
 * Place inside DropdownMenu.Popup to enable search functionality.
 * Renders a `<div>` element.
 */
export const DropdownMenuSurface = React.forwardRef<
  HTMLDivElement,
  DropdownMenuSurfaceProps
>(function DropdownMenuSurface(props, forwardedRef) {
  const {
    filter = defaultFilter,
    search: searchProp,
    onSearchChange,
    defaultSearch = '',
    loop = true,
    autoHighlightFirst = true,
    clearSearchOnClose = true,
    render,
    className,
    style,
    onPointerDown,
    onPointerMove,
    children,
    ...rest
  } = props

  // Get store and depth from Root context
  const { store, depth } = useRootContext()

  // Get submenu context (if inside a submenu)
  const submenuContext = useMaybeSubmenuContext()

  // Get focus owner store
  const focusOwnerStore = useFocusOwner()

  // Generate stable IDs
  const listId = React.useId()
  const inputId = React.useId()
  const generatedSurfaceId = React.useId()

  // Use childSurfaceId from submenu context if available, otherwise generate our own
  const surfaceId = submenuContext?.childSurfaceId ?? generatedSurfaceId

  // Subscribe to focus ownership
  const isOwner = focusOwnerStore.useState('isOwner', surfaceId)

  // Create stable callback for onSearchChange
  const handleSearchChange = useStableCallback((search: string) => {
    onSearchChange?.(search)
  })

  // Update store context with surface configuration
  React.useEffect(() => {
    store.context.filter = filter
    store.context.loop = loop
    store.context.autoHighlightFirst = autoHighlightFirst
    store.context.clearSearchOnClose = clearSearchOnClose
    store.context.listId = listId
    store.context.inputId = inputId
    store.context.onSearchChange = handleSearchChange
  }, [
    store,
    filter,
    loop,
    autoHighlightFirst,
    clearSearchOnClose,
    listId,
    inputId,
    handleSearchChange,
  ])

  // Sync controlled search prop to store
  store.useControlledProp('search', searchProp, defaultSearch)

  // Track the open state
  const open = store.useState('open')

  // Ref to the surface element for finding focusable elements
  const surfaceRef = React.useRef<HTMLDivElement | null>(null)

  // Claim focus ownership when root menu opens
  React.useEffect(() => {
    console.log(
      '[Surface] depth=%d, open=%s, surfaceId=%s',
      depth,
      open,
      surfaceId,
    )
    if (depth === 0 && open) {
      console.log(
        '[Surface] Claiming ownership for root menu, surfaceId=%s',
        surfaceId,
      )
      focusOwnerStore.setOwnerId(surfaceId)
    }
  }, [depth, open, surfaceId, focusOwnerStore])

  // Auto-focus when becoming owner
  React.useEffect(() => {
    console.log(
      '[Surface] isOwner changed: %s, surfaceId=%s, depth=%d',
      isOwner,
      surfaceId,
      depth,
    )
    if (!isOwner) return

    console.log(
      '[Surface] Becoming owner, will auto-focus, surfaceId=%s',
      surfaceId,
    )
    requestAnimationFrame(() => {
      if (!surfaceRef.current) return

      // Find input or list within this surface
      const input = surfaceRef.current.querySelector('input')
      const list = surfaceRef.current.querySelector('[role="listbox"]')
      const focusTarget = input ?? list

      console.log(
        '[Surface] Auto-focusing element:',
        focusTarget?.tagName,
        'surfaceId=%s',
        surfaceId,
      )
      if (focusTarget && focusTarget instanceof HTMLElement) {
        focusTarget.focus()
      }
    })
  }, [isOwner, surfaceId, depth])

  const contextValue = React.useMemo(
    () => ({
      store,
      surfaceId,
    }),
    [store, surfaceId],
  )

  // Prevent pointer down from stealing focus from Input
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      onPointerDown?.(event)
    },
    [onPointerDown],
  )

  // Claim focus ownership when pointer moves inside this surface
  // This handles the case when moving from a submenu back to parent
  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)

      // Check if the event target is actually within this surface's DOM
      // This prevents parent surfaces from claiming ownership when events
      // bubble through React portals from child surfaces
      const target = event.target as Node
      if (!surfaceRef.current?.contains(target)) {
        console.log(
          '[Surface] pointerMove - ignoring, target not in this surface, surfaceId=%s',
          surfaceId,
        )
        return
      }

      // Check store directly to avoid stale reactive state issues
      // Only claim ownership if we're not already the owner
      if (focusOwnerStore.state.ownerId !== surfaceId) {
        console.log(
          '[Surface] pointerMove - claiming ownership, surfaceId=%s',
          surfaceId,
        )
        focusOwnerStore.setOwnerId(surfaceId)
      }
    },
    [onPointerMove, surfaceId, focusOwnerStore],
  )

  const element = useRender({
    render,
    ref: [surfaceRef, forwardedRef],
    props: {
      ...rest,
      className,
      style,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      children,
    },
    defaultTagName: 'div',
  })

  return (
    <SurfaceContext.Provider value={contextValue}>
      {element}
    </SurfaceContext.Provider>
  )
})

export namespace DropdownMenuSurface {
  export type State = DropdownMenuSurfaceState
  export interface Props extends DropdownMenuSurfaceProps {}
}
