'use client'

import * as React from 'react'
import {
  ListboxContextProvider,
  ListboxStore,
  useMaybeListboxContext,
} from '../../../listbox/index.js'
import {
  PopupMenuContext,
  useMaybePopupMenuContext,
} from '../../contexts/popup-menu-context.js'
import { PopupSurfaceIdContext } from '../../contexts/popup-surface-id-context.js'
import { SubpageContext } from '../../contexts/subpage-context.js'
import {
  ROOT_SUBPAGE_ID,
  useSubpageStack,
} from '../../contexts/subpage-stack-context.js'

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

  const parentListboxContext = useMaybeListboxContext()
  const parentPopupMenuContext = useMaybePopupMenuContext()
  const subpageStack = useSubpageStack()

  if (!parentListboxContext || !parentPopupMenuContext) {
    throw new Error('PopupMenu.Subpage must be used within PopupMenu.Popup')
  }

  if (pageId === ROOT_SUBPAGE_ID) {
    throw new Error(
      `PopupMenu.Subpage pageId "${ROOT_SUBPAGE_ID}" is reserved for the root page`,
    )
  }

  // Create an isolated store for this page.
  const store = ListboxStore.useStore(undefined, { open: false })

  // Surface ID used by this page's Surface/List/Input.
  const surfaceId = React.useId()

  // Parent popup open state.
  const parentOpen = parentListboxContext.store.useState('open')

  const activePageId = subpageStack.activePageId
  const stack = subpageStack.stack
  const registerPage = subpageStack.registerPage
  const goBack = subpageStack.goBack
  const getSurfaceId = subpageStack.getSurfaceId

  const isActive = activePageId === pageId

  // Register this page in the popup's page registry.
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
  React.useEffect(() => {
    return parentListboxContext.registerSurface(
      parentListboxContext.depth,
      (nextOpen) => store.setOpen(nextOpen),
    )
  }, [parentListboxContext, store])

  const parentSurfaceId = React.useMemo(() => {
    const currentIndex = stack.lastIndexOf(pageId)

    if (currentIndex <= 0) {
      return getSurfaceId(ROOT_SUBPAGE_ID)
    }

    const previousPageId = stack[currentIndex - 1]
    return previousPageId ? getSurfaceId(previousPageId) : null
  }, [stack, pageId, getSurfaceId])

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

  const listboxContextValue = React.useMemo(
    () => ({
      store,
      depth: parentListboxContext.depth,
      closeAll: parentListboxContext.closeAll,
      registerSurface: parentListboxContext.registerSurface,
      virtualization: parentListboxContext.virtualization,
    }),
    [store, parentListboxContext],
  )

  const popupMenuContextValue = React.useMemo(
    () => ({
      store,
      depth: parentPopupMenuContext.depth,
      closeAll: parentPopupMenuContext.closeAll,
      explicitTabBehavior: parentPopupMenuContext.explicitTabBehavior,
      registerSurface: parentPopupMenuContext.registerSurface,
      virtualization: parentPopupMenuContext.virtualization,
      virtualAnchor: parentPopupMenuContext.virtualAnchor,
      menuType: parentPopupMenuContext.menuType,
      disabled: parentPopupMenuContext.disabled,
      closeOnOutsidePress: parentPopupMenuContext.closeOnOutsidePress,
      getQualifiedRowId: parentPopupMenuContext.getQualifiedRowId,
    }),
    [store, parentPopupMenuContext],
  )

  const shouldRenderChildren = isActive

  return (
    <SubpageContext.Provider value={subpageContextValue}>
      <PopupSurfaceIdContext.Provider value={surfaceId}>
        <PopupMenuContext.Provider value={popupMenuContextValue}>
          <ListboxContextProvider.Provider value={listboxContextValue}>
            {shouldRenderChildren ? children : null}
          </ListboxContextProvider.Provider>
        </PopupMenuContext.Provider>
      </PopupSurfaceIdContext.Provider>
    </SubpageContext.Provider>
  )
}

export namespace PopupMenuSubpage {
  export interface Props extends PopupMenuSubpageProps {}
}
