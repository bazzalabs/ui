import {
  type AsyncNodeLoader,
  type AsyncNodeLoaderContext,
  type AsyncNodeLoaderResult,
  createSurfaceStore,
  type MenuDef,
  type MenuNodeDefaults,
  useLoader,
  useMenu,
} from '@bazza-ui/menu'
import * as Dialog from '@radix-ui/react-dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import * as React from 'react'
import { useCommandMenuContext } from '../context.js'
import {
  ScopedThemeProvider,
  useScopedTheme,
} from '../contexts/theme-context.js'
import type { CommandMenuSlots } from '../types.js'
import { CommandMenuInput } from './input.js'
import { CommandMenuList } from './list.js'
import { SurfaceProvider } from './surface-provider.js'

function px(n: number) {
  return `${Math.ceil(n)}px`
}

export interface CommandMenuContentProps<T = unknown> {
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

/**
 * Inner component that handles menu orchestration and rendering
 */
function CommandMenuContentInner<T>({
  currentMenu,
  query,
  onQueryChange,
  placeholder,
  defaults,
  store,
  theme,
  loaderResult,
  pushSubmenu,
  innerContentRef,
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
  innerContentRef: (element: HTMLDivElement | null) => void
}) {
  // Build menu with deep search support from @bazza-ui/menu
  const { menu } = useMenu<T>({
    menuDef: currentMenu,
    query,
    open: true,
    surfaceId: 'command-menu',
    isSubmenu: false,
    rootLoaderResult: loaderResult,
    defaults,
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
  const listEl = <CommandMenuList query={query} onQueryChange={onQueryChange} />

  // Render footer (if provided via slots)
  const footerEl = theme?.slots?.Footer ? (
    <div data-slot="command-menu-footer">
      {theme.slots.Footer({ menu: menu as any })}
    </div>
  ) : null

  // Base props for dialog inner wrapper
  const baseProps = {
    ref: innerContentRef,
    className: theme?.classNames?.dialogInner,
    'data-slot': 'command-menu-dialog-inner' as const,
    'data-command-menu-dialog-inner': true as const,
  }

  // Render dialog inner using slot or default
  const DialogInnerSlot = theme?.slots?.DialogInner
  const contentEl = DialogInnerSlot
    ? DialogInnerSlot({
        children: (
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
        ),
        baseProps,
      })
    : React.createElement(
        'div',
        baseProps,
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
        </ScopedThemeProvider>,
      )

  return contentEl
}

export function CommandMenuContent<T = unknown>({
  query = '',
  onQueryChange,
  placeholder,
  defaults,
}: CommandMenuContentProps<T>) {
  const theme = useScopedTheme()
  const { currentMenu, pushSubmenu, navigationStack, inputRef } =
    useCommandMenuContext<T>()
  const observerRef = React.useRef<ResizeObserver | null>(null)

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

  // Get title from navigation stack (if in submenu) or from current menu
  const dialogTitle = React.useMemo(() => {
    if (navigationStack.length > 0) {
      const currentEntry = navigationStack[navigationStack.length - 1]
      return currentEntry?.menuTitle ?? 'Command Menu'
    }
    return currentMenu.title ?? currentMenu.id ?? 'Command Menu'
  }, [currentMenu, navigationStack])

  const innerContentRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      // Clean up existing observer
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }

      // If element exists, set up new observer
      if (element) {
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect
            // Set CSS variables on the parent Dialog.Content element
            // so they can be used in the dialogContent className
            const parent = element.parentElement
            if (parent) {
              parent.style.setProperty('--command-menu-width', px(width))
              parent.style.setProperty('--command-menu-height', px(height))
            }
          }
        })

        observer.observe(element)
        observerRef.current = observer
      }
    },
    [],
  )

  // Restore focus to input after navigation
  // This runs after MenuLoaderWrapper remounts due to key change
  React.useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has updated
    const rafId = requestAnimationFrame(() => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus()
      }
    })
    return () => cancelAnimationFrame(rafId)
  }, [currentMenu.id, inputRef])

  return (
    <Dialog.Portal>
      <Dialog.Overlay className={theme?.classNames?.dialogOverlay} />
      <Dialog.Content className={theme?.classNames?.dialogContent}>
        <VisuallyHidden.Root>
          <Dialog.Title>{dialogTitle}</Dialog.Title>
          <Dialog.Description>{dialogTitle}</Dialog.Description>
        </VisuallyHidden.Root>
        <MenuLoaderWrapper
          key={loaderKey}
          menuLoader={menuLoader}
          loaderContext={loaderContext}
        >
          {(loaderResult) => (
            <CommandMenuContentInner
              currentMenu={currentMenu}
              query={query}
              onQueryChange={onQueryChange}
              placeholder={placeholder}
              defaults={defaults}
              store={store}
              theme={theme}
              loaderResult={loaderResult}
              pushSubmenu={pushSubmenu}
              innerContentRef={innerContentRef}
            />
          )}
        </MenuLoaderWrapper>
      </Dialog.Content>
    </Dialog.Portal>
  )
}
