'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { useSurfaceContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { PopupMenuSeparatorDataAttributes } from './separator.data-attrs.js'

// Separator doesn't have any state - using an empty object type
export interface PopupMenuSeparatorState extends Record<string, unknown> {
  first: boolean
  last: boolean
}

const stateAttributesMapping = {
  first: (value: unknown) =>
    value ? { [PopupMenuSeparatorDataAttributes.first]: '' } : null,
  last: (value: unknown) =>
    value ? { [PopupMenuSeparatorDataAttributes.last]: '' } : null,
}

export interface PopupMenuSeparatorProps
  extends ComponentProps<'div', PopupMenuSeparator.State> {
  /**
   * Whether to always render the separator, even during search.
   * By default, separators are hidden when there's an active search query.
   * @default false
   */
  alwaysRender?: boolean
}

/**
 * A visual separator between popup menu items.
 * Hidden during active search unless `alwaysRender` is true.
 * Renders a `<div>` element with role="separator".
 */
export const PopupMenuSeparator = React.forwardRef<
  HTMLDivElement,
  PopupMenuSeparator.Props
>(function PopupMenuSeparator(props, forwardedRef) {
  const { alwaysRender = false, render, className, style, ...rest } = props

  const { store } = useSurfaceContext()
  const rowId = React.useId()
  const [rowElement, setRowElement] = React.useState<HTMLElement | null>(null)

  React.useLayoutEffect(() => {
    if (!rowElement) return undefined
    return store.registerRow(rowId, rowElement, { kind: 'separator' })
  }, [rowElement, rowId, store])

  // Get search state from store
  const search = store.useState('normalizedSearch')

  // Hide separator when there's an active search (unless alwaysRender)
  const hasSearch = search.length > 0
  const isHidden = hasSearch && !alwaysRender
  const isFirstRow = store.useState('isFirstRow', rowId)
  const isLastRow = store.useState('isLastRow', rowId)
  const state = React.useMemo(
    () => ({ first: isFirstRow, last: isLastRow }),
    [isFirstRow, isLastRow],
  )

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'separator')

  const element = useRender({
    render,
    ref: [setRowElement, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      // Using role="none" as this is a purely visual separator within a listbox.
      // The semantic separator role requires focus for interactive separators.
      role: 'none',
      className,
      style,
    },
    defaultTagName: 'div',
  })

  if (isHidden) {
    return null
  }

  return element
})

export namespace PopupMenuSeparator {
  export type State = PopupMenuSeparatorState
  export interface Props extends PopupMenuSeparatorProps {}
}
