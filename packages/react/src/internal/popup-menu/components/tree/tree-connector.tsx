'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { PopupMenuTreeConnectorDataAttributes } from './tree-connector.data-attrs.js'
import { useMaybeTreeContext } from './tree-context.js'
import { mergeTreeDepthStyle } from './tree-utils.js'

export interface PopupMenuTreeConnectorState extends Record<string, unknown> {
  depth: number
}

export interface PopupMenuTreeConnectorProps
  extends ComponentProps<'span', PopupMenuTreeConnector.State> {
  depth?: number
}

const stateAttributesMapping = {
  depth: (value: unknown): Record<string, string> => ({
    [PopupMenuTreeConnectorDataAttributes.depth]: String(value),
  }),
}

export const PopupMenuTreeConnector = React.forwardRef<
  HTMLSpanElement,
  PopupMenuTreeConnector.Props
>(function PopupMenuTreeConnector(props, forwardedRef) {
  const {
    depth: depthProp,
    render,
    className,
    style,
    children,
    ...rest
  } = props
  const treeContext = useMaybeTreeContext()
  const depth = depthProp ?? treeContext?.depth ?? 0
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'tree-connector')
  const state: PopupMenuTreeConnector.State = { depth }

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      'aria-hidden': 'true',
      'data-depth': depth,
      className,
      style: mergeTreeDepthStyle(style, depth),
      children,
    },
    defaultTagName: 'span',
  })
})

export namespace PopupMenuTreeConnector {
  export type State = PopupMenuTreeConnectorState
  export interface Props extends PopupMenuTreeConnectorProps {}
}
