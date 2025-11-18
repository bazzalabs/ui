import {
  type AsyncNodeLoader,
  type AsyncNodeLoaderContext,
  type AsyncNodeLoaderResult,
  createSurfaceStore,
  type MenuDef,
  type MenuNodeDefaults,
  useDeepSearchOrchestration,
  useLoader,
} from '@bazza-ui/menu'
import * as React from 'react'
import { useCommandMenuContext } from '../context.js'
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
 * Internal component that wraps the loader execution.
 * This component is keyed by menu ID and loader presence to ensure
 * stable hooks when navigating between menus with different loader types.
 */
function MenuLoaderWrapper<T>({
  menuLoader,
  loaderContext,
  children,
}: {
  menuLoader: AsyncNodeLoader<T> | undefined
  loaderContext: AsyncNodeLoaderContext
  children: (result: AsyncNodeLoaderResult<T> | undefined) => React.ReactNode
}) {
  const loaderResult = useLoader(menuLoader, loaderContext)
  return <>{children(loaderResult)}</>
}

export function CommandMenuList<T = unknown>({
  query = '',
  onQueryChange,
  placeholder,
  defaults,
}: CommandMenuListProps<T>) {
  const { currentMenu, pushSubmenu } = useCommandMenuContext<T>()

  // Get theme from scoped context
  const theme = useScopedTheme()

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

  // Generate a stable key based on menu ID and whether it has a loader
  // This ensures each menu/loader combination gets its own component instance
  const loaderKey = `${currentMenu.id}-${!!menuLoader}`

  return (
    <MenuLoaderWrapper
      key={loaderKey}
      menuLoader={menuLoader}
      loaderContext={loaderContext}
    >
      {(loaderResult) => (
        <CommandMenuListInner
          currentMenu={currentMenu}
          query={query}
          onQueryChange={onQueryChange}
          placeholder={placeholder}
          defaults={defaults}
          store={store}
          theme={theme}
          loaderResult={loaderResult}
          pushSubmenu={pushSubmenu}
        />
      )}
    </MenuLoaderWrapper>
  )
}

/**
 * Inner component that handles the actual list rendering
 */
function CommandMenuListInner<T>({
  currentMenu,
  query,
  onQueryChange,
  placeholder,
  defaults,
  store,
  theme,
  loaderResult,
  pushSubmenu,
}: {
  currentMenu: MenuDef<T>
  query: string
  onQueryChange?: (query: string) => void
  placeholder?: string
  defaults?: Partial<MenuNodeDefaults<T>>
  store: ReturnType<typeof createSurfaceStore<T>>
  theme: ReturnType<typeof useScopedTheme>
  loaderResult: AsyncNodeLoaderResult<T> | undefined
  pushSubmenu: ReturnType<typeof useCommandMenuContext<T>>['pushSubmenu']
}) {
  // Use centralized deep search orchestration from @bazza-ui/menu
  const { menu } = useDeepSearchOrchestration<T>({
    menuDef: currentMenu,
    query,
    open: true,
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
