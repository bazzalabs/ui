import {
  createSurfaceStore,
  type MenuDef,
  useDeepSearchOrchestration,
  useLoaderAdapter,
} from '@bazza-ui/menu'
import * as React from 'react'
import { useScopedTheme } from '../contexts/theme-context.js'
import { FocusOwnerCtx } from '../contexts/focus-owner-context.js'
import { HoverPolicyProvider } from '../contexts/hover-policy-context.js'
import { PopupMenuInput } from './input.js'
import { ListRenderer } from './list-renderer.js'
import { SurfaceProvider } from './surface-provider.js'

export interface PopupMenuListProps<T = unknown> {
  /** Menu definition */
  menu: MenuDef<T>
  /** Query for search/filtering */
  query?: string
  /** Query change callback */
  onQueryChange?: (query: string) => void
  /** Placeholder for input */
  placeholder?: string
  /** Whether input is shown */
  showInput?: boolean
  /** Vim bindings enabled */
  vimBindings?: boolean
  /** Text direction */
  dir?: 'ltr' | 'rtl'
  /** Close callback */
  onClose?: () => void
  /** Open state (for loaders) */
  open?: boolean
}

/**
 * PopupMenuList is the Surface component.
 * It creates the store and renders all surface parts: input (optional), list.
 */
export function PopupMenuList<T = unknown>({
  menu,
  query = '',
  onQueryChange,
  placeholder,
  showInput = false,
  vimBindings = true,
  dir = 'ltr',
  onClose,
  open = true,
}: PopupMenuListProps<T>) {
  // Get theme from scoped context
  const theme = useScopedTheme()

  // Get the loader adapter
  const loaderAdapter = useLoaderAdapter()

  // Create a surface store for the current menu
  const store = React.useMemo(() => createSurfaceStore<T>(), [menu.id])

  // Extract the loader from the current menu
  const menuLoader = React.useMemo(() => {
    return 'loader' in menu ? menu.loader : undefined
  }, [menu])

  // Determine if we should pass query to the loader
  const loaderQuery = React.useMemo(() => {
    const searchMode = menu.search?.mode ?? 'client'
    // Only pass query to loader for server/hybrid modes
    return searchMode === 'client' ? '' : query
  }, [menu.search?.mode, query])

  // Create loader context
  const loaderContext = React.useMemo(
    () => ({
      query: loaderQuery,
      open,
    }),
    [loaderQuery, open],
  )

  // Execute the root menu loader using the adapter
  const loaderResult = loaderAdapter.useLoader(menuLoader, loaderContext)

  // Use centralized deep search orchestration from @bazza-ui/menu
  const { menu: orchestratedMenu } = useDeepSearchOrchestration<T>({
    menuDef: menu,
    query,
    open,
    loaderAdapter,
    surfaceId: 'popup-menu',
    isSubmenu: false,
    rootLoaderResult: loaderResult,
  })

  // Render input (if showInput is true)
  const inputEl = showInput ? (
    <PopupMenuInput
      store={store}
      value={query}
      onValueChange={onQueryChange}
      placeholder={placeholder}
      vimBindings={vimBindings}
      dir={dir}
      onClose={onClose}
      onEscape={onClose}
    />
  ) : null

  // Render list
  const listEl = (
    <ListRenderer
      query={query}
      onClose={onClose}
      vimBindings={vimBindings}
      dir={dir}
    />
  )

  // Focus owner state
  const [ownerId, setOwnerId] = React.useState<string | null>('root')
  const focusOwnerValue = React.useMemo(
    () => ({ ownerId, setOwnerId }),
    [ownerId],
  )

  return (
    <FocusOwnerCtx.Provider value={focusOwnerValue}>
      <HoverPolicyProvider>
        <SurfaceProvider
          store={store}
          menu={orchestratedMenu as any}
          slots={theme?.slots as any}
          classNames={theme?.classNames}
        >
          {inputEl}
          {listEl}
        </SurfaceProvider>
      </HoverPolicyProvider>
    </FocusOwnerCtx.Provider>
  )
}
