/**
 * Merge strategy for slot props.
 * Custom function receives (a, b) and returns merged value.
 */
export type SlotPropMergeStrategy<TSlotProps> = {
  [K in keyof TSlotProps]?: (a: any, b: any) => any
}

/**
 * Configuration for createThemeSystem.
 * Can be a function (backward compatible) or config object.
 */
export type ThemeSystemConfig<TSlots, TSlotProps, TClassNames> = {
  /** Function that returns default slot implementations */
  defaultSlots: () => Required<TSlots>
  /** Optional merge strategies for specific slot props */
  slotPropMergeStrategy?: SlotPropMergeStrategy<TSlotProps>
}

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
