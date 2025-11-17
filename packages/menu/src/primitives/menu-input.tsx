import * as React from 'react'
import { mergeProps } from '../utils/merge-props.js'
import type { SurfaceStore, InputBindAPI, InputSearchState } from '../types.js'

export interface MenuInputPrimitiveProps<T = unknown> {
  /** Surface store for state management */
  store: SurfaceStore<T>
  /** Controlled value */
  value: string
  /** Value change handler */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Additional className */
  className?: string
  /** Search state information (loading, errors, etc.) */
  searchState?: InputSearchState
  /** Additional input props */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
  /** Keyboard event handler */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  /** Render prop for custom rendering with bind API */
  children?: (bind: InputBindAPI, searchState: InputSearchState) => React.ReactElement
}

/**
 * Primitive input component that provides:
 * - ARIA combobox pattern with aria-activedescendant
 * - Integration with SurfaceStore (inputRef, activeId, listId)
 * - InputBindAPI for theming and customization
 * - role="combobox" with proper ARIA attributes
 *
 * This is a low-level primitive. Package-specific keyboard navigation
 * should be implemented in the onKeyDown handler.
 */
export function MenuInputPrimitive<T = unknown>({
  store,
  value,
  onChange,
  placeholder = 'Search...',
  className,
  searchState,
  inputProps,
  onKeyDown,
  children,
}: MenuInputPrimitiveProps<T>) {
  // Subscribe to store state for ARIA attributes
  const [state, setState] = React.useState(() => store.snapshot())
  React.useEffect(() => {
    return store.subscribe(() => {
      setState(store.snapshot())
    })
  }, [store])

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange],
  )

  const baseInputProps = React.useMemo(
    () => ({
      ref: store.inputRef as any,
      role: 'combobox' as const,
      'data-menu-input': '',
      'aria-autocomplete': 'list' as const,
      'aria-expanded': true,
      'aria-controls': state.listId ?? undefined,
      'aria-activedescendant': state.activeId ?? undefined,
      placeholder,
      value,
      onChange: handleChange,
      onKeyDown,
      className,
    }),
    [
      store.inputRef,
      state.listId,
      state.activeId,
      placeholder,
      value,
      handleChange,
      onKeyDown,
      className,
    ],
  )

  const bind: InputBindAPI = React.useMemo(
    () => ({
      getInputProps: (overrides) =>
        mergeProps(baseInputProps as any, mergeProps(inputProps as any, overrides as any)),
    }),
    [baseInputProps, inputProps],
  )

  const effectiveSearchState: InputSearchState = searchState ?? { query: value }

  // Custom render via children prop
  if (children) {
    return children(bind, effectiveSearchState)
  }

  // Default render: plain input
  return <input {...(bind.getInputProps() as any)} />
}
