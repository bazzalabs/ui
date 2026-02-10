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
 * Renders when async content is loading.
 * Only visible when async loaders are actively fetching data (unless `forceMount` is true).
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

  // Check async loading state
  const asyncCoordinator = useMaybeAsyncMenuCoordinator()
  const isLoading = asyncCoordinator?.isAnyLoading ?? false
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
