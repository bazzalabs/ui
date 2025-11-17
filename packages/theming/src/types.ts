/**
 * Generic theme definition that can be provided by consumers.
 * Allows partial overrides of slots, slotProps, and classNames.
 */
export type ThemeDef<TSlots, TSlotProps, TClassNames> = {
  slots?: Partial<TSlots>
  slotProps?: Partial<TSlotProps>
  classNames?: Partial<TClassNames>
}

/**
 * Complete theme with all slots required.
 * This is what gets stored in the theme context after merging defaults.
 */
export type Theme<TSlots, TSlotProps, TClassNames> = {
  slots: Required<TSlots>
  slotProps?: Partial<TSlotProps>
  classNames?: Partial<TClassNames>
}
