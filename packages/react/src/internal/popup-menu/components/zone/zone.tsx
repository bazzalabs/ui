'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { useRovingFocus } from '../../../composite/index.js'
import {
  useListboxContext,
  useMaybeFocusZones,
  useSurfaceContext,
} from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { PopupMenuZoneDataAttributes } from './zone.data-attrs.js'

export { PopupMenuZoneDataAttributes }

type PopupMenuZonePlacement = 'header' | 'footer'

export interface PopupMenuZoneState extends Record<string, unknown> {
  placement: PopupMenuZonePlacement
  active: boolean
}

export interface PopupMenuZoneProps
  extends ComponentProps<'div', PopupMenuZoneState> {
  /**
   * Which arrow keys move focus within the zone.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical' | 'both'

  /**
   * Whether arrow navigation wraps within the zone.
   * @default false
   */
  loop?: boolean
}

interface PopupMenuZoneBaseProps extends PopupMenuZoneProps {
  placement: PopupMenuZonePlacement
}

const PopupMenuZone = React.forwardRef<HTMLDivElement, PopupMenuZoneBaseProps>(
  function PopupMenuZone(props, forwardedRef) {
    const {
      placement,
      orientation = 'horizontal',
      loop = false,
      render,
      className,
      style,
      onKeyDown,
      onFocus,
      onBlur,
      children,
      ...rest
    } = props

    const { store, surfaceId } = useSurfaceContext()
    const { closeAll } = useListboxContext()
    const focusZoneStore = useMaybeFocusZones()
    const zoneId = React.useId()
    const internalRef = React.useRef<HTMLDivElement>(null)
    const roving = useRovingFocus({
      containerRef: internalRef,
      orientation,
      loop,
    })

    React.useEffect(() => {
      if (!focusZoneStore) return
      return focusZoneStore.registerZone({
        id: zoneId,
        surfaceId,
        placement,
        getElement: () => internalRef.current,
      })
    }, [focusZoneStore, zoneId, surfaceId, placement])

    const activeZoneId = focusZoneStore?.useState('activeZoneId') ?? null
    const active = activeZoneId === zoneId

    const handleKeyDown = React.useCallback<
      React.KeyboardEventHandler<HTMLDivElement>
    >(
      (event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return

        roving.onKeyDown(event)
        if (event.defaultPrevented) return

        if (event.key === 'Tab') {
          if (focusZoneStore) {
            const target = focusZoneStore.getAdjacentTarget(
              surfaceId,
              zoneId,
              event.shiftKey ? -1 : 1,
            )
            if (target) {
              event.preventDefault()
              focusZoneStore.focusTarget(surfaceId, target)
            }
          }
          return
        }

        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          closeAll()
          return
        }

        if (placement === 'footer' && event.key === 'ArrowUp') {
          event.preventDefault()
          store.setHighlightedId(null)
          store.highlightPrev()
          focusZoneStore?.focusTarget(surfaceId, { type: 'primary' })
          return
        }

        if (placement === 'header' && event.key === 'ArrowDown') {
          event.preventDefault()
          store.setHighlightedId(null)
          store.highlightNext()
          focusZoneStore?.focusTarget(surfaceId, { type: 'primary' })
        }
      },
      [
        closeAll,
        focusZoneStore,
        onKeyDown,
        placement,
        roving,
        store,
        surfaceId,
        zoneId,
      ],
    )

    const handleFocus = React.useCallback<
      React.FocusEventHandler<HTMLDivElement>
    >(
      (event) => {
        roving.onFocus(event)
        focusZoneStore?.setActiveZoneId(zoneId)
        onFocus?.(event)
      },
      [focusZoneStore, onFocus, roving, zoneId],
    )

    const handleBlur = React.useCallback<
      React.FocusEventHandler<HTMLDivElement>
    >(
      (event) => {
        if (!internalRef.current?.contains(event.relatedTarget as Node)) {
          focusZoneStore?.setActiveZoneId(null)
        }
        onBlur?.(event)
      },
      [focusZoneStore, onBlur],
    )

    const state: PopupMenuZoneState = React.useMemo(
      () => ({ placement, active }),
      [placement, active],
    )

    const componentName = useMaybeComponentName()
    const slotAttr = getSlotAttribute(componentName, placement)

    return useRender({
      render,
      ref: [internalRef, forwardedRef],
      state,
      props: {
        ...rest,
        ...(slotAttr ? { [slotAttr]: '' } : {}),
        [PopupMenuZoneDataAttributes.placement]: placement,
        onKeyDown: handleKeyDown,
        onFocus: handleFocus,
        onBlur: handleBlur,
        className,
        style,
        children,
      },
      defaultTagName: 'div',
    })
  },
)

export interface PopupMenuHeaderProps extends PopupMenuZoneProps {}

/**
 * A focus zone rendered above the item list. Interactive children are reachable
 * with Tab and internally navigable with arrow keys.
 */
export const PopupMenuHeader = React.forwardRef<
  HTMLDivElement,
  PopupMenuHeader.Props
>(function PopupMenuHeader(props, forwardedRef) {
  return <PopupMenuZone ref={forwardedRef} {...props} placement="header" />
})

export namespace PopupMenuHeader {
  export type State = PopupMenuZoneState
  export interface Props extends PopupMenuHeaderProps {}
}

export interface PopupMenuFooterProps extends PopupMenuZoneProps {}

/**
 * A focus zone rendered below the item list. Interactive children are reachable
 * with Tab and internally navigable with arrow keys.
 */
export const PopupMenuFooter = React.forwardRef<
  HTMLDivElement,
  PopupMenuFooter.Props
>(function PopupMenuFooter(props, forwardedRef) {
  return <PopupMenuZone ref={forwardedRef} {...props} placement="footer" />
})

export namespace PopupMenuFooter {
  export type State = PopupMenuZoneState
  export interface Props extends PopupMenuFooterProps {}
}
