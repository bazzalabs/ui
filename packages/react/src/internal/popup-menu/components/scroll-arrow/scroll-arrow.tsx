'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { useSurfaceContext } from '../../../listbox/index.js'
import { PopupMenuScrollArrowDataAttributes } from './scroll-arrow.data-attrs.js'

export { PopupMenuScrollArrowDataAttributes }

type Direction = 'up' | 'down'

export interface PopupMenuScrollArrowState extends Record<string, unknown> {
  /**
   * The scroll direction this arrow controls.
   */
  direction: Direction
  /**
   * Whether there is content to scroll in this direction.
   */
  visible: boolean
}

export interface PopupMenuScrollArrowProps
  extends ComponentProps<'div', PopupMenuScrollArrowState> {
  /**
   * The direction to scroll when hovering over this arrow.
   */
  direction: Direction
  /**
   * Whether to keep the element mounted when there's nothing to scroll.
   * When false (default), the element is not rendered.
   * When true, the element is rendered but can be styled via `data-visible="false"`.
   * @default false
   */
  keepMounted?: boolean
  /**
   * Scroll speed in pixels per frame.
   * @default 10
   */
  scrollSpeed?: number
}

const stateAttributesMapping = {
  direction: (value: unknown): Record<string, string> | null =>
    value
      ? { [PopupMenuScrollArrowDataAttributes.direction]: String(value) }
      : null,
  visible: (value: unknown): Record<string, string> | null => ({
    'data-visible': value ? 'true' : 'false',
  }),
}

/**
 * Base scroll arrow component used by ScrollUpArrow and ScrollDownArrow.
 * Shows when there is content to scroll in the specified direction.
 * Scrolls the list continuously while pointer is over it.
 * Renders a `<div>` element.
 */
export const PopupMenuScrollArrow = React.forwardRef<
  HTMLDivElement,
  PopupMenuScrollArrowProps
>(function PopupMenuScrollArrow(props, forwardedRef) {
  const {
    direction,
    keepMounted = false,
    scrollSpeed = 10,
    render,
    className,
    style,
    children,
    ...rest
  } = props

  const { store } = useSurfaceContext()
  const [visible, setVisible] = React.useState(false)
  const scrollingRef = React.useRef(false)
  const rafRef = React.useRef<number | null>(null)

  // Check if there's content to scroll in this direction
  const checkVisibility = React.useCallback(() => {
    const listRef = store.context.refs.listRef
    const list = listRef?.current
    if (!list) {
      setVisible(false)
      return
    }

    if (direction === 'up') {
      // Visible when not at top
      setVisible(list.scrollTop > 0)
    } else {
      // Visible when not at bottom
      const atBottom =
        list.scrollTop + list.clientHeight >= list.scrollHeight - 1
      setVisible(!atBottom)
    }
  }, [store, direction])

  // Set up scroll listener on the list
  React.useEffect(() => {
    const listRef = store.context.refs.listRef
    const list = listRef?.current
    if (!list) return

    // Initial check
    checkVisibility()

    // Listen for scroll events
    list.addEventListener('scroll', checkVisibility, { passive: true })

    // Also check on resize (content might change)
    const resizeObserver = new ResizeObserver(checkVisibility)
    resizeObserver.observe(list)

    return () => {
      list.removeEventListener('scroll', checkVisibility)
      resizeObserver.disconnect()
    }
  }, [store, checkVisibility])

  // Also recheck when items change (filteredCount changes)
  const filteredCount = store.useState('filteredCount')
  React.useEffect(() => {
    // Delay to allow DOM to update
    requestAnimationFrame(checkVisibility)
  }, [filteredCount, checkVisibility])

  // Continuous scrolling while pointer is over
  const startScrolling = React.useCallback(() => {
    scrollingRef.current = true

    const scroll = () => {
      if (!scrollingRef.current) return

      const listRef = store.context.refs.listRef
      const list = listRef?.current
      if (list) {
        const delta = direction === 'up' ? -scrollSpeed : scrollSpeed
        list.scrollTop += delta
      }

      rafRef.current = requestAnimationFrame(scroll)
    }

    rafRef.current = requestAnimationFrame(scroll)
  }, [store, direction, scrollSpeed])

  const stopScrolling = React.useCallback(() => {
    scrollingRef.current = false
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const state: PopupMenuScrollArrowState = React.useMemo(
    () => ({ direction, visible }),
    [direction, visible],
  )

  // Determine if we should render
  const shouldRender = visible || keepMounted

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      className,
      style,
      onPointerEnter: (event: React.PointerEvent<HTMLDivElement>) => {
        startScrolling()
        rest.onPointerEnter?.(event)
      },
      onPointerLeave: (event: React.PointerEvent<HTMLDivElement>) => {
        stopScrolling()
        rest.onPointerLeave?.(event)
      },
      children,
    },
    defaultTagName: 'div',
    enabled: shouldRender,
  })
})

export namespace PopupMenuScrollArrow {
  export type State = PopupMenuScrollArrowState
  export interface Props extends PopupMenuScrollArrowProps {}
}

// ============================================================================
// Convenience Components
// ============================================================================

export interface PopupMenuScrollUpArrowProps
  extends Omit<PopupMenuScrollArrowProps, 'direction'> {}

/**
 * A scroll indicator that appears when there's content above.
 * Scrolls the list up continuously while pointer is over it.
 * Renders a `<div>` element.
 */
export const PopupMenuScrollUpArrow = React.forwardRef<
  HTMLDivElement,
  PopupMenuScrollUpArrowProps
>(function PopupMenuScrollUpArrow(props, forwardedRef) {
  return <PopupMenuScrollArrow ref={forwardedRef} direction="up" {...props} />
})

export namespace PopupMenuScrollUpArrow {
  export type State = PopupMenuScrollArrowState
  export interface Props extends PopupMenuScrollUpArrowProps {}
}

export interface PopupMenuScrollDownArrowProps
  extends Omit<PopupMenuScrollArrowProps, 'direction'> {}

/**
 * A scroll indicator that appears when there's content below.
 * Scrolls the list down continuously while pointer is over it.
 * Renders a `<div>` element.
 */
export const PopupMenuScrollDownArrow = React.forwardRef<
  HTMLDivElement,
  PopupMenuScrollDownArrowProps
>(function PopupMenuScrollDownArrow(props, forwardedRef) {
  return <PopupMenuScrollArrow ref={forwardedRef} direction="down" {...props} />
})

export namespace PopupMenuScrollDownArrow {
  export type State = PopupMenuScrollArrowState
  export interface Props extends PopupMenuScrollDownArrowProps {}
}
