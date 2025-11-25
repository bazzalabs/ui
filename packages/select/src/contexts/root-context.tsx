import type { InteractionGuardOptions } from '@bazza-ui/popup-menu'
import * as React from 'react'
import type { SelectControl } from '../control.js'
import type { SelectMenuDef } from '../types.js'

export interface RootContextValue<TData = unknown> {
  /** Unique ID for this select instance */
  scopeId: string
  /** Whether the listbox is open */
  open: boolean
  /** Function to change open state */
  onOpenChange: (open: boolean) => void
  /** Close the select (and any submenus if somehow present) */
  closeAllSurfaces: () => void
  /** Ref to the trigger element */
  triggerRef: React.RefObject<HTMLElement | null>
  /** Control API */
  control: SelectControl<TData>
  /** Current selected value (single select) */
  selectedValue?: string
  /** Current selected values (multi select) */
  selectedValues?: string[]
  /** Function to update selected value (single select) */
  onValueChange?: (value: string) => void
  /** Function to update selected values (multi select) */
  onValuesChange?: (values: string[]) => void
  /** Whether this is a multi-select */
  multiple: boolean
  /** Whether the select is disabled */
  disabled: boolean
  /** Interaction guard options */
  interactionGuardOptions: Partial<InteractionGuardOptions>
  /** The menu definition (passed to Surface for orchestration) */
  menu?: SelectMenuDef<TData>
}

const RootContext = React.createContext<RootContextValue<any> | null>(null)

export const RootContextProvider = RootContext.Provider

export function useRootContext<TData = unknown>(): RootContextValue<TData> {
  const ctx = React.useContext(RootContext)
  if (!ctx) {
    throw new Error('Select components must be used within SelectRoot')
  }
  return ctx as RootContextValue<TData>
}
