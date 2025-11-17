import {
  createSurfaceStore,
  type MenuDef,
  type MenuNodeDefaults,
  useDeepSearchOrchestration,
} from '@bazza-ui/menu'
import * as React from 'react'
import { useCommandMenuContext } from '../context.js'
import { useLoaderAdapter } from '../contexts/loader-adapter-context.js'
import {
  ScopedThemeProvider,
  useScopedTheme,
} from '../contexts/theme-context.js'
import type { CommandMenuSlots } from '../types.js'
import { CommandMenuInput } from './input.js'
import { ListRenderer } from './list-renderer.js'
import { SurfaceProvider } from './surface-provider.js'

export interface CommandMenuListProps<T = unknown> {
  query?: string
  onQueryChange?: (query: string) => void
  placeholder?: string
  defaults?: Partial<MenuNodeDefaults<T>>
}

/**
 * CommandMenuList is the Surface component.
 * It creates the store and renders all surface parts: header, input, list, footer.
 */
export function CommandMenuList<T = unknown>({
  query = '',
  onQueryChange,
  placeholder,
  defaults,
}: CommandMenuListProps<T>) {
  const { currentMenu, pushSubmenu } = useCommandMenuContext<T>()

  // Get theme from scoped context
  const theme = useScopedTheme()

  // Get the loader adapter
  const loaderAdapter = useLoaderAdapter()

  // Create a surface store for the current menu
  // Recreate store when menu changes to avoid stale state
  const store = React.useMemo(() => createSurfaceStore<T>(), [currentMenu.id])

  // Extract the loader from the current menu
  const menuLoader = React.useMemo(() => {
    return 'loader' in currentMenu ? currentMenu.loader : undefined
  }, [currentMenu])

  // Determine if we should pass query to the loader
  // When search mode is 'client', the loader should only run once with no query
  // The filtering happens client-side using the keywords array
  const loaderQuery = React.useMemo(() => {
    const searchMode = currentMenu.search?.mode ?? 'client'
    // Only pass query to loader for server/hybrid modes
    return searchMode === 'client' ? '' : query
  }, [currentMenu.search?.mode, query])

  // Create loader context
  const loaderContext = React.useMemo(
    () => ({
      query: loaderQuery,
      open: true, // Command menus are always "open" when rendered
    }),
    [loaderQuery],
  )

  // Execute the root menu loader using the adapter
  const loaderResult = loaderAdapter.useLoader(menuLoader, loaderContext)

  // Use centralized deep search orchestration from @bazza-ui/menu
  const { menu } = useDeepSearchOrchestration<T>({
    menuDef: currentMenu,
    query,
    open: true,
    loaderAdapter,
    surfaceId: 'command-menu',
    isSubmenu: false,
    rootLoaderResult: loaderResult,
    defaults,
    // No filtering needed for command-menu (unlike action-menu which filters by minLength)
  })

  // Submenu scoped theme - merge current scoped theme with submenu.ui
  const submenuTheme = React.useMemo(() => currentMenu.ui, [currentMenu.ui])

  // Handle submenu navigation - push to stack instead of opening nested popover
  const handleSubmenuSelect = React.useCallback(
    (submenuId: string, submenu: MenuDef<any>) => {
      // Find the submenu node to get its title
      const submenuNode = menu.nodes.find(
        (n) => n.kind === 'submenu' && n.id === submenuId,
      )
      const title =
        submenuNode?.kind === 'submenu'
          ? (submenuNode.title ?? submenuNode.label ?? submenuNode.id)
          : submenuId

      // IMPORTANT: If this submenu has deep search injected results (__originalLoader),
      // restore the original loader to prevent duplicates when navigating into the submenu
      // The __originalLoader is set by deep search injection and contains the original loader function
      const hasOriginalLoader = (submenu as any).__originalLoader

      const submenuToUse: MenuDef<any> = hasOriginalLoader
        ? {
            ...submenu,
            loader: (submenu as any).__originalLoader,
            nodes: undefined, // Clear injected nodes - they'll be loaded fresh
          }
        : submenu

      console.log('🚀 [handleSubmenuSelect] Pushing submenu:', {
        submenuId,
        loaderType: typeof submenuToUse.loader,
        hasNodes: !!submenuToUse.nodes,
        nodeCount: submenuToUse.nodes?.length,
      })

      pushSubmenu({
        menuId: submenuId,
        menuTitle: title,
        parentMenuId: menu.id,
      })
    },
    [menu, pushSubmenu],
  )

  // Render header (if provided via slots)
  const headerEl = theme?.slots?.Header ? (
    <div data-slot="command-menu-header">
      {theme.slots.Header({ menu: menu as any })}
    </div>
  ) : null

  // Render input
  const inputEl = (
    <CommandMenuInput
      value={query}
      onValueChange={onQueryChange}
      placeholder={placeholder}
    />
  )

  // Render list
  const listEl = <ListRenderer query={query} onQueryChange={onQueryChange} />

  // Render footer (if provided via slots)
  const footerEl = theme?.slots?.Footer ? (
    <div data-slot="command-menu-footer">
      {theme.slots.Footer({ menu: menu as any })}
    </div>
  ) : null

  return (
    <ScopedThemeProvider theme={submenuTheme}>
      <SurfaceProvider
        store={store}
        menu={menu}
        slots={theme?.slots as Required<CommandMenuSlots<T>>}
        classNames={theme?.classNames}
        slotProps={theme?.slotProps}
        onSubmenuSelect={handleSubmenuSelect}
      >
        {headerEl}
        {inputEl}
        {listEl}
        {footerEl}
      </SurfaceProvider>
    </ScopedThemeProvider>
  )
}
