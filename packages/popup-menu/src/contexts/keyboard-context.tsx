import * as React from 'react'
import type { KeyboardOptions } from '../types.js'

/** Keyboard options context */
const KeyboardCtx = React.createContext<KeyboardOptions>({
  dir: 'ltr',
  vimBindings: true,
})

export const useKeyboardOpts = () => React.useContext(KeyboardCtx)

export { KeyboardCtx }
