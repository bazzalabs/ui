import * as React from 'react'
import type { MenuTreeResolver } from '../menu-tree/resolver.js'

const MenuTreeResolverContext = React.createContext<MenuTreeResolver | null>(
  null,
)

export function useMenuTreeResolver(): MenuTreeResolver | null {
  return React.useContext(MenuTreeResolverContext)
}

export { MenuTreeResolverContext }
