'use client'

import * as React from 'react'
import { useListboxContext } from '../../listbox/index.js'
import { PopupMenuSurface } from '../components/surface/surface.js'
import { DataSurfaceContext, type DataSurfaceContextValue } from './context.js'
import type { DataSurfaceProps, DeepSearchConfig } from './types.js'
import { filterNodes } from './utils.js'

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
  PopupMenuDataSurfaceProps
>(function PopupMenuDataSurface(props, forwardedRef) {
  const {
    content,
    deepSearch = true,
    filter,
    search: searchProp,
    onSearchChange,
    defaultSearch = '',
    loop = true,
    autoHighlightFirst = true,
    clearSearchOnClose = true,
    className,
    style,
    render,
    children,
  } = props

  // Parse deep search config
  const deepSearchConfig: DeepSearchConfig = React.useMemo(() => {
    if (typeof deepSearch === 'boolean') {
      return { enabled: deepSearch, minLength: 0 }
    }
    return {
      enabled: deepSearch.enabled ?? true,
      minLength: deepSearch.minLength ?? 0,
    }
  }, [deepSearch])

  // Generate stable list ID
  const listId = React.useId()

  // Create DataSurface context value
  // Note: The actual filtering happens in DataList which has access to the store's search
  const contextValue: DataSurfaceContextValue = React.useMemo(
    () => ({
      content,
      deepSearchConfig,
      listId,
    }),
    [content, deepSearchConfig, listId],
  )

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
        {children}
      </PopupMenuSurface>
    </DataSurfaceContext.Provider>
  )
})

export namespace PopupMenuDataSurface {
  export interface Props extends PopupMenuDataSurfaceProps {}
}
