import { defaultSlots as defaultPopupSlots } from '@bazza-ui/popup-menu'
import { createThemeSystem, mergePositionerProps } from '@bazza-ui/theming'
import type * as React from 'react'
import type {
  SelectClassNames,
  SelectSlotProps,
  SelectSlots,
} from '../types.js'

/**
 * Default Trigger slot implementation for Select.
 */
function defaultTriggerSlot({
  children,
  bind,
}: import('../types.js').SelectTriggerSlotArgs): React.ReactNode {
  return (
    <button type="button" {...bind.getTriggerProps()}>
      {children}
    </button>
  )
}

/**
 * Default Value slot implementation for Select.
 */
function defaultValueSlot({
  value,
  values,
  multiple,
  placeholder,
}: import('../types.js').SelectValueSlotArgs): React.ReactNode {
  if (multiple && values && values.length > 0) {
    return `${values.length} selected`
  }
  if (!multiple && value) {
    return value
  }
  return placeholder
}

/**
 * Default Select slots extending popup menu slots with Trigger and Value slots.
 */
export function defaultSelectSlots<T>(): Required<SelectSlots<T>> {
  return {
    ...defaultPopupSlots(),
    Trigger: defaultTriggerSlot,
    Value: defaultValueSlot,
  } as Required<SelectSlots<T>>
}

/**
 * Create the theming system for Select menus.
 * Provides GlobalThemeProvider, ScopedThemeProvider, and theme hooks.
 */
const {
  mergeTheme,
  GlobalThemeProvider,
  ScopedThemeProvider,
  useGlobalTheme,
  useScopedTheme,
} = createThemeSystem<SelectSlots, SelectSlotProps, SelectClassNames>({
  defaultSlots: defaultSelectSlots,
  slotPropMergeStrategy: {
    positioner: mergePositionerProps,
  },
})

export {
  mergeTheme,
  GlobalThemeProvider,
  ScopedThemeProvider,
  useGlobalTheme,
  useScopedTheme,
}
