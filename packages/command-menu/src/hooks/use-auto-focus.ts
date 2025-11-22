import * as React from 'react'

/**
 * Hook for automatically focusing an input element when the menu changes.
 * This is used to ensure the input stays focused during navigation.
 */
export function useAutoFocus(
  inputRef: React.RefObject<HTMLInputElement>,
  menuId: string | undefined,
) {
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [inputRef, menuId])
}
