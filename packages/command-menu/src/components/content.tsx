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
import { mergeProps } from '@bazza-ui/theming'
import * as Dialog from '@radix-ui/react-dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import * as React from 'react'
import { useCommandMenuContext } from '../context.js'
import {
  ScopedThemeProvider,
  useScopedTheme,
} from '../contexts/theme-context.js'
import type { CommandMenuSlots, NavigationStackEntry } from '../types.js'
import { CommandMenuInput } from './input.js'
import { CommandMenuList } from './list.js'
import { SurfaceProvider } from './surface-provider.js'

function px(n: number) {
  return `${Math.ceil(n)}px`
}

export interface CommandMenuContentProps<T = unknown> {
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
 * Layer component that handles menu orchestration and rendering for a single menu level.
 * Each layer maintains its own independent query state, matching popup menu architecture.
 */
function CommandMenuContentLayer<T>({
  menuDef,
  placeholder,
  defaults,
  visible,
  depth,
  pushSubmenu,
  innerContentRef,
}: {
  menuDef: MenuDef<T>
  placeholder?: string
  defaults?: Partial<MenuNodeDefaults<T>>
  visible: boolean
  depth: number
  pushSubmenu: ReturnType<typeof useCommandMenuContext<T>>['pushSubmenu']
  innerContentRef?: (element: HTMLDivElement | null) => void
}) {
  const theme = useScopedTheme()

  // Each layer has its own independent query state (matching popup menu)
  const [query, setQuery] = React.useState('')

  // Create a surface store for this menu layer
  const store = React.useMemo(() => createSurfaceStore<T>(), [menuDef.id])

  // Extract the loader from the menu
  const menuLoader = React.useMemo(() => {
    return 'loader' in menuDef ? menuDef.loader : undefined
  }, [menuDef])

  // Determine if we should pass query to the loader
  const loaderQuery = React.useMemo(() => {
    const searchMode = menuDef.search?.mode ?? 'client'
    return searchMode === 'client' ? '' : query
  }, [menuDef.search?.mode, query])

  // Create loader context
  const loaderContext = React.useMemo(
    () => ({
      query: loaderQuery,
      open: true,
    }),
    [loaderQuery],
  )

  // Execute loader
  const loaderResult = useLoader(menuLoader, loaderContext)

  // Clear query when this layer becomes visible (navigating into it)
  React.useEffect(() => {
    if (visible && depth > 0) {
      setQuery('')
    }
  }, [visible, depth])

  // Reset active ID to first item when this layer becomes visible (navigating back)
  const prevVisibleRef = React.useRef(visible)
  React.useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      // Layer just became visible - reset to first item
      store.first('keyboard')
    }
    prevVisibleRef.current = visible
  }, [visible, store])

  // Build menu with deep search support from @bazza-ui/menu
  const { menu } = useMenu<T>({
    menuDef,
    query,
    open: true,
    surfaceId: 'command-menu',
    isSubmenu: false,
    rootLoaderResult: loaderResult,
    defaults,
  })

  // Submenu scoped theme - merge current scoped theme with submenu.ui
  const submenuTheme = React.useMemo(() => menuDef.ui, [menuDef.ui])

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
      onValueChange={setQuery}
      placeholder={placeholder}
    />
  )

  // Render list
  const listEl = <CommandMenuList query={query} onQueryChange={setQuery} />

  // Render footer (if provided via slots)
  const footerEl = theme?.slots?.Footer ? (
    <div data-slot="command-menu-footer">
      {theme.slots.Footer({ menu: menu as any })}
    </div>
  ) : null

  // Create base props for DialogInner
  const dialogInnerBaseProps = React.useMemo(
    () => ({
      ref: (element: HTMLDivElement | null) => {
        if (innerContentRef) {
          innerContentRef(element)
        }
      },
      className: theme?.classNames?.dialogInner,
      'data-slot': 'command-menu-dialog-inner' as const,
      'data-command-menu-dialog-inner': true as const,
      style: { display: visible ? 'block' : 'none' },
    }),
    [innerContentRef, theme?.classNames?.dialogInner, visible],
  )

  // Create bind object for DialogInner
  const dialogInnerBind = React.useMemo(
    () => ({
      getDialogInnerProps: (overrides?: any) =>
        mergeProps(
          dialogInnerBaseProps as any,
          mergeProps(theme?.slotProps?.dialogInner as any, overrides),
        ),
    }),
    [dialogInnerBaseProps, theme?.slotProps?.dialogInner],
  )

  // Shared children for DialogInner
  const innerChildren = (
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

  // Render dialog inner using slot or default
  const DialogInnerSlot = theme?.slots?.DialogInner
  const contentEl = DialogInnerSlot
    ? DialogInnerSlot({
        children: innerChildren,
        bind: dialogInnerBind,
      })
    : React.createElement(
        'div',
        dialogInnerBind.getDialogInnerProps(),
        innerChildren,
      )

  return contentEl
}

/**
 * Deep search for a submenu node by ID anywhere in the tree
 */
function findSubmenuDeep<T>(
  nodes: Array<any>,
  submenuId: string,
): any | undefined {
  for (const node of nodes) {
    if (node.kind === 'submenu' && node.id === submenuId) {
      return node
    }
    if (node.kind === 'submenu' && node.nodes) {
      const found = findSubmenuDeep(node.nodes, submenuId)
      if (found) return found
    }
  }
  return undefined
}

/**
 * Helper to build menu stack from root menu + navigation stack.
 * Returns array of [menuDef, depth] tuples for rendering layers.
 *
 * IMPORTANT: Uses a cache to ensure stable menuDef references when navigating.
 * This prevents unnecessary re-instantiation of menus when going back to a previously visited menu.
 */
function buildMenuStack<T>(
  rootMenu: MenuDef<T>,
  navigationStack: NavigationStackEntry[],
  menuDefCache: Map<string, MenuDef<T>>,
): Array<{ menuDef: MenuDef<T>; depth: number }> {
  const stack: Array<{ menuDef: MenuDef<T>; depth: number }> = [
    { menuDef: rootMenu, depth: 0 },
  ]

  let currentMenuDef: MenuDef<T> = rootMenu

  for (let i = 0; i < navigationStack.length; i++) {
    const entry = navigationStack[i]
    if (!entry) continue

    const nodes = currentMenuDef.nodes || []
    // First try to find in immediate children
    let submenuNode = nodes.find(
      (n) => n.kind === 'submenu' && n.id === entry.menuId,
    )

    // If not found and this is the first navigation (from root), try deep search
    // This handles deep search results that inject nested submenus into root results
    if (!submenuNode && i === 0) {
      submenuNode = findSubmenuDeep(rootMenu.nodes || [], entry.menuId)
    }

    if (submenuNode && submenuNode.kind === 'submenu') {
      // Check cache first to maintain stable object references
      const cacheKey = entry.menuId
      let cachedMenuDef = menuDefCache.get(cacheKey)

      // Only create new menuDef if not in cache or if the submenu node has changed
      if (!cachedMenuDef) {
        const hasInjectedResults = (submenuNode as any).__originalLoader

        cachedMenuDef = {
          id: submenuNode.id || entry.menuId,
          title: submenuNode.title,
          nodes: hasInjectedResults ? undefined : submenuNode.nodes,
          loader: hasInjectedResults
            ? (submenuNode as any).__originalLoader
            : submenuNode.loader,
          search: submenuNode.search,
          defaults: submenuNode.defaults,
          ui: submenuNode.ui,
          virtualization: submenuNode.virtualization,
          inputPlaceholder: submenuNode.inputPlaceholder,
          hideSearchUntilActive: submenuNode.hideSearchUntilActive,
          input: submenuNode.input,
          open: submenuNode.open,
          middleware: submenuNode.middleware,
        } as MenuDef<T>

        menuDefCache.set(cacheKey, cachedMenuDef)
      }

      currentMenuDef = cachedMenuDef
      stack.push({ menuDef: currentMenuDef, depth: i + 1 })
    }
  }

  return stack
}

export function CommandMenuContent<T = unknown>({
  placeholder,
  defaults,
}: CommandMenuContentProps<T>) {
  const theme = useScopedTheme()
  const { rootMenu, currentMenu, pushSubmenu, navigationStack, inputRef } =
    useCommandMenuContext<T>()
  const observerRef = React.useRef<ResizeObserver | null>(null)

  // Cache for menu definitions to ensure stable object references across navigations
  // This prevents unnecessary menu re-instantiation when navigating back
  const menuDefCacheRef = React.useRef<Map<string, MenuDef<T>>>(new Map())

  // Build menu stack for rendering layers
  const menuStack = React.useMemo(
    () => buildMenuStack(rootMenu, navigationStack, menuDefCacheRef.current),
    [rootMenu, navigationStack],
  )

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

  // Get slots
  const DialogPortalSlot = theme?.slots?.DialogPortal
  const DialogOverlaySlot = theme?.slots?.DialogOverlay
  const DialogContentSlot = theme?.slots?.DialogContent

  // Create base props for Dialog Portal
  // Memoize to prevent unnecessary re-renders during animations
  const dialogPortalBaseProps = React.useMemo(
    () => ({
      'data-slot': 'command-menu-dialog-portal' as const,
    }),
    [],
  )

  // Create base props for Dialog Overlay
  // Memoize to ensure stable props during exit animations
  const dialogOverlayBaseProps = React.useMemo(
    () => ({
      className: theme?.classNames?.dialogOverlay,
      'data-slot': 'command-menu-dialog-overlay' as const,
    }),
    [theme?.classNames?.dialogOverlay],
  )

  // Create base props for Dialog Content
  const dialogContentBaseProps = React.useMemo(
    () => ({
      className: theme?.classNames?.dialogContent,
      'data-slot': 'command-menu-dialog-content' as const,
    }),
    [theme?.classNames?.dialogContent],
  )

  // Create bind objects with getXProps methods that merge base + slotProps + user overrides
  const dialogPortalBind = React.useMemo(
    () => ({
      getDialogPortalProps: (overrides?: any) =>
        mergeProps(
          dialogPortalBaseProps as any,
          mergeProps(theme?.slotProps?.dialogPortal as any, overrides),
        ),
    }),
    [dialogPortalBaseProps, theme?.slotProps?.dialogPortal],
  )

  const dialogOverlayBind = React.useMemo(
    () => ({
      getDialogOverlayProps: (overrides?: any) =>
        mergeProps(
          dialogOverlayBaseProps as any,
          mergeProps(theme?.slotProps?.dialogOverlay as any, overrides),
        ),
    }),
    [dialogOverlayBaseProps, theme?.slotProps?.dialogOverlay],
  )

  const dialogContentBind = React.useMemo(
    () => ({
      getDialogContentProps: (overrides?: any) =>
        mergeProps(
          dialogContentBaseProps as any,
          mergeProps(theme?.slotProps?.dialogContent as any, overrides),
        ),
    }),
    [dialogContentBaseProps, theme?.slotProps?.dialogContent],
  )

  // Shared content for all rendering paths
  const contentChildren = (
    <>
      <VisuallyHidden.Root>
        <Dialog.Title>{dialogTitle}</Dialog.Title>
        <Dialog.Description>{dialogTitle}</Dialog.Description>
      </VisuallyHidden.Root>
      {/* Render a layer for each menu in the stack */}
      {menuStack.map(({ menuDef, depth }) => {
        const isVisible = depth === menuStack.length - 1
        return (
          <CommandMenuContentLayer
            key={menuDef.id}
            menuDef={menuDef}
            placeholder={placeholder}
            defaults={defaults}
            visible={isVisible}
            depth={depth}
            pushSubmenu={pushSubmenu}
            innerContentRef={isVisible ? innerContentRef : undefined}
          />
        )
      })}
    </>
  )

  // Render overlay - use slot or default
  const overlayElement = DialogOverlaySlot ? (
    DialogOverlaySlot({ bind: dialogOverlayBind })
  ) : (
    <Dialog.Overlay {...dialogOverlayBind.getDialogOverlayProps()} />
  )

  // Render content - use slot or default
  const contentElement = DialogContentSlot ? (
    DialogContentSlot({
      children: contentChildren,
      bind: dialogContentBind,
    })
  ) : (
    <Dialog.Content {...dialogContentBind.getDialogContentProps()}>
      {contentChildren}
    </Dialog.Content>
  )

  // Render portal - use slot or default
  const portalElement = DialogPortalSlot ? (
    DialogPortalSlot({
      children: (
        <>
          {overlayElement}
          {contentElement}
        </>
      ),
      bind: dialogPortalBind,
    })
  ) : (
    <Dialog.Portal {...dialogPortalBind.getDialogPortalProps()}>
      {overlayElement}
      {contentElement}
    </Dialog.Portal>
  )

  return portalElement
}
