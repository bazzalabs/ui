import * as React from 'react'

/**
 * Hook to manage input activation state for hideSearchUntilActive behavior.
 * Returns state and keyboard handler to activate input when user starts typing.
 */
export function useInputActivation(hideSearchUntilActive?: boolean) {
  const [inputActive, setInputActive] = React.useState(!hideSearchUntilActive)
  const [query, setQuery] = React.useState('')

  // Reset input active state when hideSearchUntilActive changes
  React.useEffect(() => {
    setInputActive(!hideSearchUntilActive)
  }, [hideSearchUntilActive])

  /**
   * Keyboard handler to activate input when typing starts.
   * Should be attached to the list element.
   */
  const handleTypeStart = React.useCallback(
    (e: React.KeyboardEvent) => {
      // Don't activate on modifier keys or if input is already active
      if (inputActive || e.altKey || e.ctrlKey || e.metaKey) {
        return false
      }

      // Backspace - activate with empty query
      if (e.key === 'Backspace') {
        setInputActive(true)
        setQuery('')
        return true
      }

      // Single printable character - activate with that character
      if (e.key.length === 1) {
        setInputActive(true)
        setQuery(e.key)
        return true
      }

      return false
    },
    [inputActive],
  )

  return {
    inputActive,
    setInputActive,
    query,
    setQuery,
    handleTypeStart,
  }
}
