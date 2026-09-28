import type * as React from 'react'
import {
  composeStyle,
  type StateStyle,
} from '../../../../utils/resolve-state-props.js'
import { PopupMenuTreeItemCssVars } from './tree-item.css-vars.js'

export function mergeTreeDepthStyle<State>(
  style: StateStyle<State>,
  depth: number,
): React.CSSProperties | ((state: State) => React.CSSProperties) {
  return composeStyle(
    style,
    (resolvedStyle) =>
      ({
        ...resolvedStyle,
        [PopupMenuTreeItemCssVars.treeDepth]: depth,
      }) as React.CSSProperties,
  )
}
