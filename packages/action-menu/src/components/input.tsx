import * as React from 'react'
import { useDisplayMode } from '../contexts/display-mode-context.js'
import { useNavKeydown } from '../hooks/use-nav-keydown.js'
import { useSurfaceSel } from '../hooks/use-surface-sel.js'
import { mergeProps } from '../lib/merge-props.js'
import { hasDescendantWithProp } from '../lib/react-utils.js'
import type {
  InputBindAPI,
  SurfaceSlotProps,
  SurfaceSlots,
  SurfaceStore,
} from '../types.js'

export function Input<T>({
  store,
  value,
  onChange,
  slot,
  slotProps,
  inputPlaceholder,
  className,
}: {
  store: SurfaceStore<T>
  value: string
  onChange: (v: string) => void
  slot: NonNullable<SurfaceSlots<T>['Input']>
  slotProps: SurfaceSlotProps['input']
  inputPlaceholder?: string
  className?: string
}) {
  const activeId = useSurfaceSel(store, (s) => s.activeId ?? undefined)
  const listId = useSurfaceSel(store, (s) => s.listId ?? undefined)
  const mode = useDisplayMode()
  const onKeyDown = useNavKeydown('input')

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange],
  )

  const baseInputProps = React.useMemo(
    () => ({
      ref: store.inputRef as any,
      role: 'combobox' as const,
      'data-slot': 'action-menu-input' as const,
      'data-action-menu-input': true as const,
      'aria-autocomplete': 'list' as const,
      'aria-expanded': true,
      'aria-controls': listId,
      'aria-activedescendant': activeId,
      'data-mode': mode,
      className: className,
      placeholder: inputPlaceholder ?? 'Filter...',
      value,
      onChange: handleChange,
      onKeyDown,
    }),
    [
      store.inputRef,
      listId,
      activeId,
      mode,
      className,
      inputPlaceholder,
      value,
      handleChange,
      onKeyDown,
    ],
  )

  const bind: InputBindAPI = React.useMemo(
    () => ({
      getInputProps: (overrides) =>
        mergeProps(
          baseInputProps as any,
          mergeProps(slotProps as any, overrides as any),
        ),
    }),
    [baseInputProps, slotProps],
  )

  const el = slot({ value, onChange, bind })
  if (!hasDescendantWithProp(el, 'data-action-menu-input'))
    return <input {...(bind.getInputProps(slotProps as any) as any)} />
  return el as React.ReactElement
}
