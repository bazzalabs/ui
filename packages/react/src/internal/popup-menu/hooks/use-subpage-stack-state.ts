'use client'

import * as React from 'react'
import type { ListboxStore } from '../../listbox/index.js'
import {
  ROOT_SUBPAGE_ID,
  type SubpageStackContextValue,
} from '../contexts/subpage-stack-context.js'

const SUBPAGE_NAVIGATING_MS = 140

export interface UseSubpageStackStateParams {
  /** Surface ID of the root page (the popup's own surface). */
  surfaceId: string
  /** Listbox store; used to chain onPopupCloseComplete reset. Null-safe. */
  store: ListboxStore | null
}

export interface UseSubpageStackStateReturn {
  /** Context value provided to SubpageStackContext consumers. */
  subpageStackContextValue: SubpageStackContextValue
  /** Whether subpage navigation is in its transient animation window. */
  isSubpageNavigating: boolean
  /** Whether any non-root subpage is currently open. */
  hasOpenSubpage: boolean
  /** Active subpage ID, or null when only the root page is open. */
  subpageId: string | null
  /** Ordered stack of open non-root subpage IDs. */
  openSubpageIds: string[]
}

/**
 * Centralized subpage stack state for popup menu surfaces.
 */
export function useSubpageStackState(
  params: UseSubpageStackStateParams,
): UseSubpageStackStateReturn {
  const { surfaceId, store } = params

  // Subpage stack state (per popup instance)
  const [subpageStack, setSubpageStack] = React.useState<string[]>([
    ROOT_SUBPAGE_ID,
  ])
  const subpageStackRef = React.useRef(subpageStack)
  React.useEffect(() => {
    subpageStackRef.current = subpageStack
  }, [subpageStack])

  const subpagesRef = React.useRef<
    Map<string, { surfaceId: string; closeRootOnEsc: boolean }>
  >(new Map())
  const [subpageRegistryVersion, setSubpageRegistryVersion] = React.useState(0)
  const [isSubpageNavigating, setIsSubpageNavigating] = React.useState(false)
  const subpageNavigatingTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null)

  const clearSubpageNavigatingTimer = React.useCallback(() => {
    if (subpageNavigatingTimerRef.current !== null) {
      clearTimeout(subpageNavigatingTimerRef.current)
      subpageNavigatingTimerRef.current = null
    }
  }, [])

  const beginSubpageNavigation = React.useCallback(() => {
    setIsSubpageNavigating(true)
    clearSubpageNavigatingTimer()
    subpageNavigatingTimerRef.current = setTimeout(() => {
      subpageNavigatingTimerRef.current = null
      setIsSubpageNavigating(false)
    }, SUBPAGE_NAVIGATING_MS)
  }, [clearSubpageNavigatingTimer])

  React.useEffect(
    () => clearSubpageNavigatingTimer,
    [clearSubpageNavigatingTimer],
  )

  React.useEffect(() => {
    subpagesRef.current.set(ROOT_SUBPAGE_ID, {
      surfaceId,
      closeRootOnEsc: true,
    })
    setSubpageRegistryVersion((v) => v + 1)
    return () => {
      subpagesRef.current.delete(ROOT_SUBPAGE_ID)
      setSubpageRegistryVersion((v) => v + 1)
    }
  }, [surfaceId])

  const registerPage = React.useCallback(
    (registration: {
      pageId: string
      surfaceId: string
      closeRootOnEsc: boolean
    }) => {
      subpagesRef.current.set(registration.pageId, {
        surfaceId: registration.surfaceId,
        closeRootOnEsc: registration.closeRootOnEsc,
      })
      setSubpageRegistryVersion((v) => v + 1)

      return () => {
        subpagesRef.current.delete(registration.pageId)
        setSubpageRegistryVersion((v) => v + 1)

        setSubpageStack((prev) => {
          if (!prev.includes(registration.pageId)) {
            return prev
          }
          const next = prev.filter((id) => id !== registration.pageId)
          return next.length > 0 ? next : [ROOT_SUBPAGE_ID]
        })
      }
    },
    [],
  )

  const openPage = React.useCallback(
    (pageId: string) => {
      if (!subpagesRef.current.has(pageId)) {
        return false
      }

      const currentStack = subpageStackRef.current
      const currentPageId = currentStack[currentStack.length - 1]
      if (currentPageId === pageId) {
        return false
      }

      setSubpageStack((prev) => [...prev, pageId])
      beginSubpageNavigation()
      return true
    },
    [beginSubpageNavigation],
  )

  const goBack = React.useCallback(() => {
    const currentStack = subpageStackRef.current
    if (currentStack.length <= 1) {
      return false
    }

    setSubpageStack((prev) => prev.slice(0, -1))
    beginSubpageNavigation()
    return true
  }, [beginSubpageNavigation])

  const getSurfaceId = React.useCallback(
    (pageId: string) => subpagesRef.current.get(pageId)?.surfaceId ?? null,
    [],
  )

  const resetSubpageNavigationState = React.useCallback(() => {
    setSubpageStack([ROOT_SUBPAGE_ID])
    setIsSubpageNavigating(false)
    clearSubpageNavigatingTimer()
  }, [clearSubpageNavigatingTimer])

  React.useEffect(() => {
    if (!store) {
      return
    }

    const previous = store.context.onPopupCloseComplete
    const handlePopupCloseComplete = () => {
      previous?.()
      resetSubpageNavigationState()
    }

    store.context.onPopupCloseComplete = handlePopupCloseComplete

    return () => {
      if (store.context.onPopupCloseComplete === handlePopupCloseComplete) {
        store.context.onPopupCloseComplete = previous
      }
      clearSubpageNavigatingTimer()
    }
  }, [store, resetSubpageNavigationState, clearSubpageNavigatingTimer])

  const activePageId = subpageStack[subpageStack.length - 1] ?? ROOT_SUBPAGE_ID
  const activePageRegistration = subpagesRef.current.get(activePageId)
  const activeSurfaceId = activePageRegistration?.surfaceId ?? surfaceId
  const shouldCloseRootOnEsc = activePageRegistration?.closeRootOnEsc ?? true
  const canGoBack = subpageStack.length > 1
  const openSubpageIds = React.useMemo(
    () => subpageStack.filter((pageId) => pageId !== ROOT_SUBPAGE_ID),
    [subpageStack],
  )
  const subpageId = openSubpageIds[openSubpageIds.length - 1] ?? null
  const hasOpenSubpage = subpageId !== null

  const subpageStackContextValue = React.useMemo(() => {
    void subpageRegistryVersion

    return {
      activePageId,
      activeSurfaceId,
      canGoBack,
      shouldCloseRootOnEsc,
      stack: subpageStack,
      registerPage,
      openPage,
      goBack,
      getSurfaceId,
    }
  }, [
    subpageRegistryVersion,
    activePageId,
    activeSurfaceId,
    canGoBack,
    shouldCloseRootOnEsc,
    subpageStack,
    registerPage,
    openPage,
    goBack,
    getSurfaceId,
  ])

  return {
    subpageStackContextValue,
    isSubpageNavigating,
    hasOpenSubpage,
    subpageId,
    openSubpageIds,
  }
}
