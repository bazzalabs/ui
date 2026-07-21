import type * as React from 'react'
import { PopupMenuTreeItemCssVars } from './tree-item.css-vars.js'

export function mergeTreeDepthStyle<State>(
  style:
    | React.CSSProperties
    | ((state: State) => React.CSSProperties | undefined)
    | undefined,
  depth: number,
): React.CSSProperties | ((state: State) => React.CSSProperties) {
  if (typeof style === 'function') {
    return (state: State) =>
      ({
        ...style(state),
        [PopupMenuTreeItemCssVars.treeDepth]: depth,
      }) as React.CSSProperties
  }

  return {
    ...style,
    [PopupMenuTreeItemCssVars.treeDepth]: depth,
  } as React.CSSProperties
}
