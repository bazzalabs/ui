'use client'

import * as React from 'react'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import type { PopupMenuItemProps, PopupMenuItemState } from '../item/item.js'
import { PopupMenuItem } from '../item/item.js'
import { useMaybeTreeContext } from './tree-context.js'
import { PopupMenuTreeItemDataAttributes } from './tree-item.data-attrs.js'
import { mergeTreeDepthStyle } from './tree-utils.js'

export interface PopupMenuTreeItemProps
  extends Omit<PopupMenuItemProps, 'activatable'> {
  /** Whether this tree item can be activated. @default true */
  selectable?: boolean
  /** Explicit tree depth override. */
  depth?: number
}

export const PopupMenuTreeItem = React.forwardRef<
  HTMLDivElement,
  PopupMenuTreeItem.Props
>(function PopupMenuTreeItem(props, forwardedRef) {
  const {
    selectable = true,
    depth: depthProp,
    style,
    children,
    ...rest
  } = props
  const treeContext = useMaybeTreeContext()
  const depth = depthProp ?? treeContext?.depth ?? 0
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'tree-item')

  return (
    <PopupMenuItem
      {...rest}
      ref={forwardedRef}
      activatable={selectable}
      style={mergeTreeDepthStyle<PopupMenuItemState>(style, depth)}
      {...{
        ...(slotAttr ? { [slotAttr]: '' } : {}),
        [PopupMenuTreeItemDataAttributes.treeItem]: '',
        [PopupMenuTreeItemDataAttributes.depth]: depth,
        ...(selectable === false
          ? { [PopupMenuTreeItemDataAttributes.header]: '' }
          : {}),
      }}
    >
      {children}
    </PopupMenuItem>
  )
})

export namespace PopupMenuTreeItem {
  export type State = PopupMenuItemState
  export interface Props extends PopupMenuTreeItemProps {}
}
