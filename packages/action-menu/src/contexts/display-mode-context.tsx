import * as React from 'react'
import type { MenuDisplayMode } from '../types.js'

const DisplayModeCtx = React.createContext<MenuDisplayMode>('dropdown')

export const useDisplayMode = () => React.useContext(DisplayModeCtx)

export { DisplayModeCtx }
