'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { useSurfaceContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useMaybeAsyncMenuCoordinator } from '../../deep-search/async-coordinator.js'

// Empty doesn't have any state - using an empty object type
export interface PopupMenuEmptyState extends Record<string, unknown> {}

export interface PopupMenuEmptyProps
  extends ComponentProps<'div', PopupMenuEmpty.State> {
  children: React.ReactNode
}

/**
 * Renders when no items match the current search query.
 * Only visible when there's an active search with zero results.
 * Renders a `<div>` element.
 */
export const PopupMenuEmpty = React.forwardRef<
  HTMLDivElement,
  PopupMenuEmpty.Props
>(function PopupMenuEmpty(props, forwardedRef) {
  const { render, className, style, children, ...rest } = props

  const { store } = useSurfaceContext()

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'empty')

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

  // Don't show empty state while async loaders are still fetching.
  // Same logic as Loading: suppress when __root__ is loading OR when any loader
  // is loading during an active search (deep search in progress).
  const asyncCoordinator = useMaybeAsyncMenuCoordinator()
  const isLoading = asyncCoordinator
    ? asyncCoordinator.isRootLoading ||
      (asyncCoordinator.isAnyLoading && asyncCoordinator.searchQuery.length > 0)
    : false

  // Use dedicated selector for this check
  const hasNoResults = store.useState('hasSearchWithNoResults')
  const shouldRender = !isLoading && hasNoResults

  if (!shouldRender) {
    return null
  }

  return element
})

export namespace PopupMenuEmpty {
  export type State = PopupMenuEmptyState
  export interface Props extends PopupMenuEmptyProps {}
}
