'use client'

import { useRender } from '@base-ui/react/use-render'
import { useStore } from '@base-ui/utils/store'
import * as React from 'react'
import {
  resolveClassName,
  resolveStyle,
} from '../../../../utils/resolve-state-props.js'
import type { ComponentProps } from '../../../../utils/types.js'
import { useRowPosition } from '../../../listbox/hooks/use-row-position.js'
import { useSurfaceContext } from '../../../listbox/index.js'
import { hasResults } from '../../../listbox/store/ListboxStore.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useMaybeAsyncMenuCoordinator } from '../../data-first/async-coordinator.js'
import { PopupMenuEmptyDataAttributes } from './empty.data-attrs.js'

// Empty doesn't have any state - using an empty object type
export interface PopupMenuEmptyState extends Record<string, unknown> {
  first: boolean
  last: boolean
}

const stateAttributesMapping = {
  first: (value: unknown) =>
    value ? { [PopupMenuEmptyDataAttributes.first]: '' } : null,
  last: (value: unknown) =>
    value ? { [PopupMenuEmptyDataAttributes.last]: '' } : null,
}

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
  const rowId = React.useId()
  const [rowElement, setRowElement] = React.useState<HTMLElement | null>(null)

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'empty')

  const asyncCoordinator = useMaybeAsyncMenuCoordinator()
  // "No results" also waits until the root loader has settled for the current
  // search (e.g. a refetch that keeps the previous rows is not an answer yet).
  const isLoading = asyncCoordinator
    ? asyncCoordinator.isRootLoading ||
      (asyncCoordinator.isAnyLoading &&
        asyncCoordinator.searchQuery.length > 0) ||
      !asyncCoordinator.rootReveal.settled
    : false
  const hasNoResults = !useStore(store, hasResults)
  const shouldRender = !isLoading && hasNoResults

  // A row while it shows: it leaves the registry in the commit that hides it.
  React.useLayoutEffect(() => {
    if (!rowElement || !shouldRender) return undefined
    return store.registerRow(rowId, rowElement, { kind: 'empty' })
  }, [rowElement, rowId, shouldRender, store])

  const { first, last } = useRowPosition(store, rowId)
  const state = React.useMemo(() => ({ first, last }), [first, last])

  const element = useRender({
    render,
    ref: [setRowElement, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      role: 'presentation',
      className: resolveClassName(className, state),
      style: resolveStyle(style, state),
      children,
    },
    defaultTagName: 'div',
  })

  // Don't show empty state while async loaders are still in initial loading.
  // Same logic as Loading: suppress when __root__ is initially loading OR when
  // any loader is initially loading during an active search.
  if (!shouldRender) {
    return null
  }

  return element
})

export namespace PopupMenuEmpty {
  export type State = PopupMenuEmptyState
  export interface Props extends PopupMenuEmptyProps {}
}
