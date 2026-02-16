'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { ItemContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { useSubpageStack } from '../../contexts/subpage-stack-context.js'
import { usePopupMenuItem } from '../../hooks/use-popup-menu-item.js'
import { PopupMenuSubpageTriggerDataAttributes } from './subpage-trigger.data-attrs.js'

export { PopupMenuSubpageTriggerDataAttributes }

export interface PopupMenuSubpageTriggerState extends Record<string, unknown> {
  /** Whether this is a subpage trigger (always true). */
  subpageTrigger: boolean
  /** Whether the target page is active. */
  popupOpen: boolean
  /** Whether the target page owns keyboard focus. */
  popupFocused: boolean
  /** Whether the item is highlighted. */
  highlighted: boolean
  /** Whether the item is disabled. */
  disabled: boolean
}

const stateAttributesMapping = {
  subpageTrigger: (value: unknown) =>
    value
      ? { [PopupMenuSubpageTriggerDataAttributes.subpageTrigger]: '' }
      : null,
  popupOpen: (value: unknown) =>
    value ? { [PopupMenuSubpageTriggerDataAttributes.popupOpen]: '' } : null,
  popupFocused: (value: unknown) =>
    value ? { [PopupMenuSubpageTriggerDataAttributes.popupFocused]: '' } : null,
  highlighted: (value: unknown) =>
    value ? { [PopupMenuSubpageTriggerDataAttributes.highlighted]: '' } : null,
  disabled: (value: unknown) =>
    value ? { [PopupMenuSubpageTriggerDataAttributes.disabled]: '' } : null,
}

export interface PopupMenuSubpageTriggerProps
  extends ComponentProps<'div', PopupMenuSubpageTrigger.State> {
  /** Explicit unique identifier for this item in the store. */
  id?: string
  /** Unique value for this item used for filtering. */
  value?: string
  /** Additional keywords to match against when filtering. */
  keywords?: string[]
  /** Whether this item is disabled. */
  disabled?: boolean
  /** Whether to force render this item regardless of filter results. */
  forceMount?: boolean
  /**
   * Forces this row's relative order during score-based sorting.
   * Lower values appear earlier.
   * @default 0
   */
  forceOrder?: number
  /**
   * Overrides this row's computed fuzzy-match score.
   */
  forceScore?: number
  /** Target page ID to open when this trigger is selected. */
  targetPageId: string
}

/**
 * A menu item that pushes a new page in the same popup.
 * Renders a `<div>` element with role="menuitem".
 */
export const PopupMenuSubpageTrigger = React.forwardRef<
  HTMLDivElement,
  PopupMenuSubpageTrigger.Props
>(function PopupMenuSubpageTrigger(props, forwardedRef) {
  const {
    id: idProp,
    value,
    keywords,
    disabled = false,
    forceMount = false,
    forceOrder,
    forceScore,
    targetPageId,
    render,
    className,
    style,
    onClick,
    onPointerDown,
    onPointerMove,
    children,
    ...rest
  } = props

  const focusOwnerStore = useFocusOwner()
  const subpageStack = useSubpageStack()
  const activePageId = subpageStack.activePageId
  const openPage = subpageStack.openPage
  const getSurfaceId = subpageStack.getSurfaceId

  const openTargetPage = React.useCallback(() => {
    const didOpen = openPage(targetPageId)
    if (!didOpen) {
      return
    }

    const targetSurfaceId = getSurfaceId(targetPageId)
    if (targetSurfaceId) {
      focusOwnerStore.setOwnerId(targetSurfaceId)
    }
  }, [openPage, getSurfaceId, targetPageId, focusOwnerStore])

  const item = usePopupMenuItem({
    id: idProp,
    value,
    keywords,
    disabled,
    forceMount,
    forceOrder,
    forceScore,
    isSubmenuTrigger: false,
    closeOnClick: false,
    onSelect: openTargetPage,
    children,
  })

  const isTargetOpen = activePageId === targetPageId
  const targetSurfaceId = getSurfaceId(targetPageId)
  const isPopupFocused = focusOwnerStore.useState(
    'isOwner',
    targetSurfaceId ?? '',
  )

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      item.handlers.onPointerDown(event)
      onPointerDown?.(event)
    },
    [item.handlers, onPointerDown],
  )

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) {
        item.handlers.onClick(event)
      }
    },
    [item.handlers, onClick],
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)
      if (!event.defaultPrevented) {
        item.handlers.onPointerMove(event)
      }
    },
    [onPointerMove, item.handlers],
  )

  const state: PopupMenuSubpageTrigger.State = React.useMemo(
    () => ({
      subpageTrigger: true,
      popupOpen: isTargetOpen,
      popupFocused: isPopupFocused,
      highlighted: item.isHighlighted,
      disabled,
    }),
    [isTargetOpen, isPopupFocused, item.isHighlighted, disabled],
  )

  const wrappedChildren = (
    <ItemContext.Provider value={item.contextValue}>
      {children}
    </ItemContext.Provider>
  )

  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'subpage-trigger')

  return useRender({
    render,
    ref: [item.ref, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      id: item.id,
      role: 'menuitem',
      'aria-haspopup': 'menu',
      'aria-expanded': isTargetOpen,
      tabIndex: -1,
      'aria-disabled': disabled || undefined,
      className,
      style,
      onPointerDown: handlePointerDown,
      onClick: handleClick,
      onPointerMove: handlePointerMove,
      children: wrappedChildren,
    },
    enabled: item.isVisible,
    defaultTagName: 'div',
  })
})

export namespace PopupMenuSubpageTrigger {
  export type State = PopupMenuSubpageTriggerState
  export interface Props extends PopupMenuSubpageTriggerProps {}
}
