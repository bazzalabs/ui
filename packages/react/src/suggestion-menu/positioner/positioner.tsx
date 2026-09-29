'use client'

import * as React from 'react'
import {
  PopupMenuPositioner,
  usePopupMenuContext,
} from '../../internal/popup-menu/index.js'
import { useSuggestionMenuRootContext } from '../root/root-context.js'

type Side = NonNullable<PopupMenuPositioner.Props['side']>
type CollisionAvoidance = PopupMenuPositioner.Props['collisionAvoidance']

export interface SuggestionMenuPositionerProps
  extends PopupMenuPositioner.Props {
  /**
   * Which side of the anchor to place the popup on. If there's no room, it
   * opens on the other side, and stays there until it closes.
   * @default 'bottom'
   */
  side?: Side
  /**
   * How to align the popup against the anchor.
   * @default 'start'
   */
  align?: PopupMenuPositioner.Props['align']
}

/**
 * Positions the popup against the host's text. The side is chosen when the
 * menu opens and held until it closes: the popup may shift along the line,
 * but never flips between above and below while it's open.
 * Renders a `<div>` element.
 */
export const SuggestionMenuPositioner = React.forwardRef<
  HTMLDivElement,
  SuggestionMenuPositionerProps
>(function SuggestionMenuPositioner(props, forwardedRef) {
  const {
    side = 'bottom',
    align = 'start',
    collisionAvoidance,
    ...rest
  } = props
  const { store } = usePopupMenuContext()
  const { query, anchorReady: anchored } = useSuggestionMenuRootContext()
  const open = store.useState('open')
  const positionerRef = React.useRef<HTMLDivElement | null>(null)
  const [heldSide, setHeldSide] = React.useState<Side | null>(null)

  // The side is chosen when the menu opens: Base UI positions the popup
  // asynchronously, and the side it chose (after any flip) has landed by the
  // next frame after there's an anchor. It's held from then on.
  const holdRenderedSide = React.useCallback(() => {
    const rendered = positionerRef.current?.getAttribute('data-side')
    setHeldSide((current) => current ?? ((rendered as Side | null) || side))
  }, [side])
  React.useLayoutEffect(() => {
    if (!open) {
      setHeldSide(null)
      return undefined
    }
    if (!anchored) return undefined
    const frame = requestAnimationFrame(holdRenderedSide)
    return () => cancelAnimationFrame(frame)
  }, [open, anchored, holdRenderedSide])
  // Frames don't run in a background tab; the first keystroke after the
  // popup was positioned against the anchor holds it then.
  const anchoredQueryRef = React.useRef<string | null>(null)
  React.useLayoutEffect(() => {
    if (!open || !anchored) {
      anchoredQueryRef.current = null
      return
    }
    if (anchoredQueryRef.current === null) {
      anchoredQueryRef.current = query
      return
    }
    if (query !== anchoredQueryRef.current) holdRenderedSide()
  }, [open, query, anchored, holdRenderedSide])

  // Only ever above or below: a popup beside the anchor would cover the text
  // being typed.
  const base: CollisionAvoidance = collisionAvoidance ?? {
    side: 'flip',
    align: 'shift',
    fallbackAxisSide: 'none',
  }
  const resolvedCollisionAvoidance: CollisionAvoidance =
    heldSide !== null
      ? { ...(typeof base === 'object' ? base : {}), side: 'none' }
      : base

  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      positionerRef.current = node
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    },
    [forwardedRef],
  )

  return (
    <PopupMenuPositioner
      ref={setRef}
      {...rest}
      side={heldSide ?? side}
      align={align}
      collisionAvoidance={resolvedCollisionAvoidance}
    />
  )
})

export namespace SuggestionMenuPositioner {
  export type Props = SuggestionMenuPositionerProps
}
