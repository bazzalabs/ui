'use client'

import * as React from 'react'
import { ListboxContextProvider, ListboxStore } from '../../../listbox/index.js'
import { PopupMenuContext } from '../../contexts/popup-menu-context.js'
import { PopupSurfaceIdContext } from '../../contexts/popup-surface-id-context.js'
import { SubpageContext } from '../../contexts/subpage-context.js'
import { useSubpageStack } from '../../contexts/subpage-stack-context.js'
import { useMaybeMenuSurfaceSettings } from '../../contexts/surface-settings-context.js'
import {
  MenuSurfaceTier,
  SurfaceTierContext,
  useMaybeMenuSurfaceTier,
} from '../../contexts/surface-tier-context.js'

export interface PopupMenuSubpageProps {
  /** Unique page ID for stack navigation. */
  pageId: string
  /**
   * Whether pressing Escape in this page closes the entire menu tree.
   * When false (default), Escape navigates back one page.
   * @default false
   */
  closeRootOnEsc?: boolean
  children: React.ReactNode
}

/**
 * Groups all parts of a subpage.
 * Creates an isolated menu surface that renders in the same popup and
 * participates in push/pop page stack navigation.
 * Doesn't render its own HTML element.
 */
export function PopupMenuSubpage(props: PopupMenuSubpageProps) {
  const { pageId, closeRootOnEsc = false, children } = props

  // The page shares its popup's level: its depth and its settings.
  const parentTier = useMaybeMenuSurfaceTier()
  const parentSettings = useMaybeMenuSurfaceSettings()
  const subpageStack = useSubpageStack()

  if (!parentTier || !parentSettings) {
    throw new Error('PopupMenu.Subpage must be used within PopupMenu.Popup')
  }

  // Create an isolated store for this page.
  const store = ListboxStore.useStore(undefined, { open: false })

  // Surface ID used by this page's Surface/List/Input.
  const surfaceId = React.useId()

  // Parent popup open state.
  const parentOpen = parentTier.store.useState('open')

  const activePageId = subpageStack.activePageId
  const stack = subpageStack.stack
  const registerPage = subpageStack.registerPage
  const goBack = subpageStack.goBack
  const getSurfaceId = subpageStack.getSurfaceId
  const rootSurfaceId = subpageStack.rootSurfaceId

  const isActive = activePageId === pageId && getSurfaceId(pageId) === surfaceId

  // Register this page in the popup's page registry. Duplicate IDs: the
  // first registration wins (warned once in development); if it unmounts a
  // surviving duplicate is promoted by the registry.
  React.useEffect(() => {
    return registerPage({
      pageId,
      surfaceId,
      closeRootOnEsc,
    })
  }, [registerPage, pageId, surfaceId, closeRootOnEsc])

  // Sync this page's store open state with popup open + page activity.
  React.useEffect(() => {
    store.setOpen(parentOpen && isActive)
  }, [store, parentOpen, isActive])

  // Register with root closeAll tracking.
  const parentDepth = parentTier.depth
  const { registerSurface } = parentSettings
  React.useEffect(() => {
    return registerSurface(parentDepth, (nextOpen) => store.setOpen(nextOpen))
  }, [registerSurface, parentDepth, store])

  const parentSurfaceId = React.useMemo(() => {
    const currentIndex = stack.lastIndexOf(pageId)

    if (currentIndex <= 0) {
      return rootSurfaceId
    }

    // Every string is a valid page ID, including the empty string.
    const previousPageId = stack[currentIndex - 1]
    return previousPageId === undefined ? null : getSurfaceId(previousPageId)
  }, [stack, pageId, getSurfaceId, rootSurfaceId])

  const subpageContextValue = React.useMemo(
    () => ({
      pageId,
      surfaceId,
      parentSurfaceId,
      isActive,
      closeRootOnEsc,
      goBack,
    }),
    [pageId, surfaceId, parentSurfaceId, isActive, closeRootOnEsc, goBack],
  )

  // The published contexts: the popup's level, with the page's store.
  const { closeAll, virtualization } = parentSettings
  const listboxContextValue = React.useMemo(
    () => ({
      store,
      depth: parentDepth,
      closeAll,
      registerSurface,
      virtualization,
    }),
    [store, parentDepth, closeAll, registerSurface, virtualization],
  )

  const popupMenuContextValue = React.useMemo(
    () => ({ store, depth: parentDepth, ...parentSettings }),
    [store, parentDepth, parentSettings],
  )

  // The page's surface tier; the submenu around it stays its submenu, and
  // its settings are its popup's (`SurfaceSettingsContext` around it).
  const surfaceTier = React.useMemo(
    () =>
      // Its settings and its `disabled` are its popup's: none of its own.
      new MenuSurfaceTier(store, parentTier, parentTier.depth, surfaceId),
    [store, parentTier, surfaceId],
  )

  const shouldRenderChildren = isActive

  return (
    <SubpageContext.Provider value={subpageContextValue}>
      <PopupSurfaceIdContext.Provider value={surfaceId}>
        <PopupMenuContext.Provider value={popupMenuContextValue}>
          <ListboxContextProvider.Provider value={listboxContextValue}>
            <SurfaceTierContext.Provider value={surfaceTier}>
              {shouldRenderChildren ? children : null}
            </SurfaceTierContext.Provider>
          </ListboxContextProvider.Provider>
        </PopupMenuContext.Provider>
      </PopupSurfaceIdContext.Provider>
    </SubpageContext.Provider>
  )
}

export namespace PopupMenuSubpage {
  export interface Props extends PopupMenuSubpageProps {}
}
