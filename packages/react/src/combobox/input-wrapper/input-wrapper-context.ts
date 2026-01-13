import * as React from 'react'

/**
 * Context to indicate that children are inside an InputWrapper.
 * When true, Input should not apply its own z-index styles for input-embedded layout.
 */
export const ComboboxInputWrapperContext = React.createContext<boolean>(false)

/**
 * Hook to check if component is inside a ComboboxInputWrapper.
 */
export function useIsInsideInputWrapper(): boolean {
  return React.useContext(ComboboxInputWrapperContext)
}
