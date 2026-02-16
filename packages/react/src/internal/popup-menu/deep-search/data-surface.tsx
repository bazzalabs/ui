'use client'

import * as React from 'react'
import { useSurfaceContext } from '../../listbox/index.js'
import { PopupMenuSurface } from '../components/surface/surface.js'
import { usePopupMenuContext } from '../contexts/popup-menu-context.js'
import { AsyncMenuCoordinatorProvider } from './async-coordinator.js'
import {
  DataSurfaceContext,
  type DataSurfaceContextValue,
  useMaybeDataPopupContext,
} from './context.js'
import type { DataSurfaceProps, DeepSearchConfig } from './types.js'
import { defaultGetQualifiedRowId } from './utils.js'

function DataSurfaceAsyncCoordinatorScope({
  children,
}: {
  children: React.ReactNode
}) {
  const { store } = useSurfaceContext()
  const searchQuery = store.useState('search')

  return (
    <AsyncMenuCoordinatorProvider searchQuery={searchQuery}>
      {children}
    </AsyncMenuCoordinatorProvider>
  )
}

// ============================================================================
// DataSurface Component
// ============================================================================

export interface PopupMenuDataSurfaceProps extends DataSurfaceProps {
  /** Custom class name */
  className?: string
  /** Custom styles */
  style?: React.CSSProperties
  /** Render function for custom element */
  render?: React.ReactElement
}

/**
 * DataSurface provides deep search functionality for popup menus.
 * It wraps the standard Surface and adds data-first search capabilities.
 *
 * Place inside PopupMenu.Popup to enable deep search functionality.
 * Renders a `<div>` element.
 */
export const PopupMenuDataSurface = React.forwardRef<
  HTMLDivElement,
  PopupMenuDataSurface.Props
>(function PopupMenuDataSurface(props, forwardedRef) {
  const {
    content,
    asyncContent,
    deepSearch = true,
    includeInDeepSearch = true,
    filter: _filter,
    search: searchProp,
    onSearchChange,
    defaultSearch = '',
    loop = true,
    autoHighlightFirst = true,
    clearSearchOnClose = true,
    getQualifiedRowId: getQualifiedRowIdProp,
    className,
    style,
    render,
    children,
  } = props

  // Get getQualifiedRowId from popup menu context (set at Root level), or use prop, or use default
  const popupMenuContext = usePopupMenuContext()
  const getQualifiedRowId =
    getQualifiedRowIdProp ??
    popupMenuContext.getQualifiedRowId ??
    defaultGetQualifiedRowId

  // Parse deep search config
  const deepSearchConfig: DeepSearchConfig = React.useMemo(() => {
    if (typeof deepSearch === 'boolean') {
      return {
        enabled: deepSearch,
        minLength: 0,
        groupSearchBehavior: 'preserve',
        radioGroupSearchBehavior: 'preserve',
        sortGroups: true,
        asyncResultBehavior: 'stream',
      }
    }
    return {
      enabled: deepSearch.enabled ?? true,
      minLength: deepSearch.minLength ?? 0,
      groupSearchBehavior: deepSearch.groupSearchBehavior ?? 'preserve',
      radioGroupSearchBehavior:
        deepSearch.radioGroupSearchBehavior ?? 'preserve',
      sortGroups: deepSearch.sortGroups ?? true,
      asyncResultBehavior: deepSearch.asyncResultBehavior ?? 'stream',
    }
  }, [deepSearch])

  // Generate stable list ID
  const listId = React.useId()

  // Create DataSurface context value
  // Note: The actual filtering happens in DataList which has access to the store's search
  const contextValue: DataSurfaceContextValue = React.useMemo(
    () => ({
      content: content ?? [],
      asyncContent,
      deepSearchConfig,
      includeInDeepSearch,
      listId,
      getQualifiedRowId,
    }),
    [
      content,
      asyncContent,
      deepSearchConfig,
      includeInDeepSearch,
      listId,
      getQualifiedRowId,
    ],
  )

  const dataPopupContext = useMaybeDataPopupContext()
  const setDataSurfaceContext = dataPopupContext?.setDataSurfaceContext

  React.useEffect(() => {
    if (!setDataSurfaceContext) {
      return
    }

    setDataSurfaceContext(contextValue)

    return () => {
      setDataSurfaceContext((current) =>
        current === contextValue ? null : current,
      )
    }
  }, [setDataSurfaceContext, contextValue])

  return (
    <DataSurfaceContext.Provider value={contextValue}>
      <PopupMenuSurface
        ref={forwardedRef}
        // Disable Surface's built-in filtering - DataList handles filtering via filterNodes()
        filter={false}
        search={searchProp}
        onSearchChange={onSearchChange}
        defaultSearch={defaultSearch}
        loop={loop}
        autoHighlightFirst={autoHighlightFirst}
        clearSearchOnClose={clearSearchOnClose}
        className={className}
        style={style}
        render={render}
      >
        <DataSurfaceAsyncCoordinatorScope>
          {children}
        </DataSurfaceAsyncCoordinatorScope>
      </PopupMenuSurface>
    </DataSurfaceContext.Provider>
  )
})

export namespace PopupMenuDataSurface {
  export interface Props extends PopupMenuDataSurfaceProps {}
}
