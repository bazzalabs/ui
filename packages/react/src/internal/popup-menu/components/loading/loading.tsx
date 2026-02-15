'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useMaybeAsyncMenuCoordinator } from '../../deep-search/async-coordinator.js'

// Loading doesn't have any state - using an empty object type
export interface PopupMenuLoadingState extends Record<string, unknown> {}

export interface PopupMenuLoadingProps
  extends ComponentProps<'div', PopupMenuLoading.State> {
  children: React.ReactNode

  /**
   * Whether to force render the loading indicator regardless of async loading state.
   * When true, the component always renders, allowing you to control visibility externally.
   * @default false
   */
  forceMount?: boolean
}

/**
 * Renders when async content is in initial loading.
 * Only visible during first-load phases (unless `forceMount` is true).
 * Renders a `<div>` element.
 */
export const PopupMenuLoading = React.forwardRef<
  HTMLDivElement,
  PopupMenuLoading.Props
>(function PopupMenuLoading(props, forwardedRef) {
  const {
    forceMount = false,
    render,
    className,
    style,
    children,
    ...rest
  } = props

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'loading')

  const element = useRender({
    render,
    ref: forwardedRef,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      role: 'presentation',
      className,
      style,
      children,
    },
    defaultTagName: 'div',
  })

  // Check async loading state.
  // Two cases where we show the loading indicator:
  // 1. The __root__ loader (DataSurface's own asyncContent) is loading
  // 2. ANY loader is in initial loading AND the user has typed a search query
  //
  // Case 2 distinguishes between:
  // - Root menu deep search ("se") → user is waiting for results → show spinner
  // - Submenu opened with minLength=0 → just preloading child loaders → no spinner (Bug #6)
  const asyncCoordinator = useMaybeAsyncMenuCoordinator()
  const isLoading = asyncCoordinator
    ? asyncCoordinator.isRootLoading ||
      (asyncCoordinator.isAnyLoading && asyncCoordinator.searchQuery.length > 0)
    : false
  const shouldRender = forceMount || isLoading

  if (!shouldRender) {
    return null
  }

  return element
})

export namespace PopupMenuLoading {
  export type State = PopupMenuLoadingState
  export interface Props extends PopupMenuLoadingProps {}
}
