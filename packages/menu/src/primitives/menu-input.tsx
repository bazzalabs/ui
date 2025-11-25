import { mergeProps } from '@bazza-ui/theming'
import * as React from 'react'
import { type StoreApi, useStore } from 'zustand'
import type { BaseMenuStore, SurfaceRefs } from '../store/types.js'
import type { InputBindAPI, InputSearchState } from '../types.js'

export interface MenuInputPrimitiveProps<T = unknown> {
  /** Surface ID for this input */
  surfaceId: string
  /** Global store API */
  globalStore: StoreApi<BaseMenuStore<T>>
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
  /** Whether the input is disabled */
  disabled?: boolean
  /** Render prop for custom rendering with bind API */
  children?: (
    bind: InputBindAPI,
    searchState: InputSearchState,
  ) => React.ReactElement
}

/**
 * Primitive input component that provides:
 * - ARIA combobox pattern with aria-activedescendant
 * - Integration with global store (surfaceId, activeId)
 * - InputBindAPI for theming and customization
 * - role="combobox" with proper ARIA attributes
 *
 * This is a low-level primitive. Package-specific keyboard navigation
 * should be implemented in the onKeyDown handler.
 */
export function MenuInputPrimitive<T = unknown>({
  surfaceId,
  globalStore,
  value,
  onChange,
  placeholder = 'Search...',
  className,
  searchState,
  inputProps,
  onKeyDown,
  disabled = false,
  children,
}: MenuInputPrimitiveProps<T>) {
  // Subscribe to surface's activeId from global store
  const activeId = useStore(
    globalStore,
    React.useCallback(
      (state: BaseMenuStore<T>) =>
        state.surfaces.get(surfaceId)?.activeId ?? null,
      [surfaceId],
    ),
  )

  // Subscribe to surface existence so we re-render when surface is registered
  const surfaceExists = useStore(
    globalStore,
    React.useCallback(
      (state: BaseMenuStore<T>) => state.surfaces.has(surfaceId),
      [surfaceId],
    ),
  )

  // Get refs from global store - re-evaluate when surface exists changes
  const refs = React.useMemo<SurfaceRefs | undefined>(
    () =>
      surfaceExists
        ? globalStore.getState().getSurfaceRefs(surfaceId)
        : undefined,
    [globalStore, surfaceId, surfaceExists],
  )

  const listId = `${surfaceId}-list`

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return // Block input changes when disabled
      onChange(e.target.value)
    },
    [onChange, disabled],
  )

  const baseInputProps = React.useMemo(
    () => ({
      ref: refs?.inputRef as any,
      role: 'combobox' as const,
      'data-menu-input': '',
      'aria-autocomplete': 'list' as const,
      'aria-expanded': true,
      'aria-controls': listId,
      'aria-activedescendant': activeId ?? undefined,
      'aria-disabled': disabled,
      'data-disabled': disabled,
      placeholder,
      value,
      onChange: handleChange,
      onKeyDown,
      className,
      disabled,
      readOnly: disabled,
    }),
    [
      refs?.inputRef,
      listId,
      activeId,
      placeholder,
      value,
      handleChange,
      onKeyDown,
      className,
      disabled,
    ],
  )

  const bind: InputBindAPI = React.useMemo(
    () => ({
      getInputProps: (overrides) =>
        mergeProps(
          baseInputProps as any,
          mergeProps(inputProps as any, overrides as any),
        ),
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
