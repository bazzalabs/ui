import * as React from 'react'
import type { PopupMenuNode } from '../menu-tree/types.js'

/** The enclosing submenu's resolved node — the graft point a nested data Surface attaches its content under. Null at the popup root and wherever the enclosing branch is not part of a resolved tree. */
const GraftPointContext = React.createContext<PopupMenuNode | null>(null)

export function useGraftPoint(): PopupMenuNode | null {
  return React.useContext(GraftPointContext)
}

export { GraftPointContext }
