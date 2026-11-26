'use client'

import { useRender } from '@base-ui/react/use-render'
import type { LinkItemFields } from '@bazza-ui/menu-core'
import * as React from 'react'
import {
  resolveClassName,
  resolveStyle,
} from '../../../../utils/resolve-state-props.js'
import type { ComponentProps } from '../../../../utils/types.js'
import { ItemContext, useListboxContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { usePopupMenuItem } from '../../hooks/use-popup-menu-item.js'
import { PopupMenuLinkItemDataAttributes } from './link-item.data-attrs.js'

export { PopupMenuLinkItemDataAttributes }

export interface PopupMenuLinkItemState extends Record<string, unknown> {
  highlighted: boolean
  disabled: boolean
  first: boolean
  last: boolean
  firstInGroup: boolean
  lastInGroup: boolean
}

export interface PopupMenuLinkItemProps
  extends LinkItemFields,
    Omit<ComponentProps<'a', PopupMenuLinkItem.State>, 'onSelect'> {}

const stateAttributesMapping = {
  highlighted: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuLinkItemDataAttributes.highlighted]: '' } : null,
  disabled: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuLinkItemDataAttributes.disabled]: '' } : null,
  first: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuLinkItemDataAttributes.first]: '' } : null,
  last: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuLinkItemDataAttributes.last]: '' } : null,
  firstInGroup: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuLinkItemDataAttributes.firstInGroup]: '' } : null,
  lastInGroup: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuLinkItemDataAttributes.lastInGroup]: '' } : null,
}

export const PopupMenuLinkItem = React.forwardRef<
  HTMLAnchorElement,
  PopupMenuLinkItem.Props
>(function PopupMenuLinkItem(props, forwardedRef) {
  const {
    id,
    value,
    keywords,
    disabled: disabledProp = false,
    onSelect,
    forceMount = false,
    closeOnClick = false,
    shortcut,
    forceOrder,
    forceScore,
    render,
    className,
    style,
    onClick,
    onPointerDown,
    onPointerMove,
    children,
    ...rest
  } = props
  const { closeAll } = useListboxContext()
  const anchorRef = React.useRef<HTMLAnchorElement>(null)
  const item = usePopupMenuItem({
    id,
    value,
    keywords,
    disabled: disabledProp,
    forceMount,
    shortcut,
    forceOrder,
    forceScore,
    closeOnClick,
    children,
  })
  const disabled = item.disabled

  React.useEffect(() => {
    const handleSelect = () => {
      if (disabled) return
      anchorRef.current?.click()
    }
    return item.registerSelect(handleSelect)
  }, [disabled, item])

  const state: PopupMenuLinkItem.State = React.useMemo(
    () => ({
      highlighted: item.isHighlighted,
      disabled,
      first: item.positional.first,
      last: item.positional.last,
      firstInGroup: item.positional.firstInGroup,
      lastInGroup: item.positional.lastInGroup,
    }),
    [item.isHighlighted, disabled, item.positional],
  )
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event)
      if (event.defaultPrevented) return
      if (disabled) {
        event.preventDefault()
        return
      }
      onSelect?.()
      if (
        closeOnClick &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey
      ) {
        closeAll()
      }
    },
    [onClick, disabled, onSelect, closeOnClick, closeAll],
  )
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLAnchorElement>) => {
      item.handlers.onPointerDown(
        event as unknown as React.PointerEvent<HTMLDivElement>,
      )
      onPointerDown?.(event)
    },
    [item.handlers, onPointerDown],
  )
  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLAnchorElement>) => {
      onPointerMove?.(event)
      if (!event.defaultPrevented) {
        item.handlers.onPointerMove(
          event as unknown as React.PointerEvent<HTMLDivElement>,
        )
      }
    },
    [onPointerMove, item.handlers],
  )
  const wrappedChildren = (
    <ItemContext.Provider value={item.contextValue}>
      {children}
    </ItemContext.Provider>
  )
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'link-item')

  return useRender({
    render,
    ref: [
      item.ref as React.Ref<HTMLAnchorElement>,
      item.rowRef as React.Ref<HTMLAnchorElement>,
      anchorRef,
      forwardedRef,
    ],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      id: item.id,
      role: 'option',
      tabIndex: -1,
      'aria-selected': item.isHighlighted,
      'aria-disabled': disabled || undefined,
      className: resolveClassName(className, state),
      style: resolveStyle(style, state),
      onClick: handleClick,
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
      children: wrappedChildren,
    },
    enabled: item.isVisible,
    defaultTagName: 'a',
  })
})

export namespace PopupMenuLinkItem {
  export type State = PopupMenuLinkItemState
  export interface Props extends PopupMenuLinkItemProps {}
}
