'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { PopupMenuTreeDataAttributes } from './tree.data-attrs.js'
import { TreeContext, useMaybeTreeContext } from './tree-context.js'

export interface PopupMenuTreeState extends Record<string, unknown> {
  depth: number
}

export interface PopupMenuTreeProps
  extends ComponentProps<'div', PopupMenuTree.State> {
  children: React.ReactNode
}

const stateAttributesMapping = {
  depth: (value: unknown): Record<string, string> => ({
    [PopupMenuTreeDataAttributes.depth]: String(value),
  }),
}

export const PopupMenuTree = React.forwardRef<
  HTMLDivElement,
  PopupMenuTree.Props
>(function PopupMenuTree(props, forwardedRef) {
  const { render, className, style, children, ...rest } = props
  const depth = (useMaybeTreeContext()?.depth ?? 0) + 1
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'tree')
  const state: PopupMenuTree.State = { depth }

  const element = useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
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

  return (
    <TreeContext.Provider value={{ depth }}>{element}</TreeContext.Provider>
  )
})

export namespace PopupMenuTree {
  export type State = PopupMenuTreeState
  export interface Props extends PopupMenuTreeProps {}
}
