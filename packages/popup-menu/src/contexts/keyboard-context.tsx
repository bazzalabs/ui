import * as React from 'react'
import type { KeyboardOptions } from '../types.js'

/** Keyboard options context */
const KeyboardCtx = React.createContext<KeyboardOptions>({
  dir: 'ltr',
  vimBindings: true,
})

/**
 * Hook to access keyboard options from context.
 */
export const useKeyboardOpts = (): KeyboardOptions =>
  React.useContext(KeyboardCtx)

export { KeyboardCtx }
