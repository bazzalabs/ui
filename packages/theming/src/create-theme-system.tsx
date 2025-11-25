import * as React from 'react'
import { mergeClassNames, mergeSlotProps } from './merge-props.js'
import type { Theme, ThemeDef } from './types.js'

/**
 * Creates a complete theming system for a component.
 * Returns theme contexts, providers, hooks, and merge function.
 *
 * @param defaultSlots - Function that returns all default slot implementations
 * @returns Object containing theme utilities (mergeTheme, providers, hooks)
 *
 * @example
 * ```tsx
 * const {
 *   mergeTheme,
 *   GlobalThemeProvider,
 *   ScopedThemeProvider,
 *   useGlobalTheme,
 *   useScopedTheme,
 * } = createThemeSystem<ActionMenuSlots, ActionMenuSlotProps, ActionMenuClassNames>(
 *   defaultSlots
 * )
 * ```
 */
export function createThemeSystem<TSlots, TSlotProps, TClassNames>(
  defaultSlots: () => Required<TSlots>,
) {
  /**
   * Merges two themes together, with b taking precedence over a.
   * Intelligently combines slots, slotProps, and classNames.
   */
  const mergeTheme = (
    a?: Theme<TSlots, TSlotProps, TClassNames>,
    b?:
      | ThemeDef<TSlots, TSlotProps, TClassNames>
      | Theme<TSlots, TSlotProps, TClassNames>,
  ): Theme<TSlots, TSlotProps, TClassNames> => ({
    slots: { ...a?.slots, ...b?.slots } as Required<TSlots>,
    slotProps: mergeSlotProps(
      a?.slotProps,
      b?.slotProps,
    ) as Partial<TSlotProps>,
    classNames: mergeClassNames(
      a?.classNames ?? {},
      b?.classNames ?? {},
    ) as Partial<TClassNames>,
  })

  /**
   * Global theme context - provides the base theme for the entire component tree
   */
  const GlobalThemeContext = React.createContext<
    Theme<TSlots, TSlotProps, TClassNames>
  >({
    slots: defaultSlots(),
  })

  /**
   * Hook to access the global theme from anywhere in the component tree
   */
  const useGlobalTheme = () =>
    React.useContext(GlobalThemeContext) as Theme<
      TSlots,
      TSlotProps,
      TClassNames
    >

  /**
   * Provider for the global theme - should wrap the root component
   */
  const GlobalThemeProvider = React.memo(function GlobalThemeProvider({
    theme,
    children,
  }: {
    theme: Theme<TSlots, TSlotProps, TClassNames>
    children: React.ReactNode
  }) {
    const value = React.useMemo(() => theme, [theme])
    return (
      <GlobalThemeContext.Provider value={value}>
        {children}
      </GlobalThemeContext.Provider>
    )
  })

  /**
   * Scoped theme context - provides theme for a specific surface (e.g., submenu)
   */
  const ScopedThemeContext = React.createContext<
    Theme<TSlots, TSlotProps, TClassNames>
  >({
    slots: defaultSlots(),
  })

  /**
   * Hook to access the scoped theme - this is what components should use
   */
  const useScopedTheme = () =>
    React.useContext(ScopedThemeContext) as Theme<
      TSlots,
      TSlotProps,
      TClassNames
    >

  /**
   * Provider for scoped themes - merges global theme with scoped overrides
   * Used for submenus or other nested contexts that need theme customization
   */
  const ScopedThemeProvider = React.memo(function ScopedThemeProvider({
    theme,
    children,
    __scopeId,
  }: {
    theme?:
      | Theme<TSlots, TSlotProps, TClassNames>
      | ThemeDef<TSlots, TSlotProps, TClassNames>
    children: React.ReactNode
    __scopeId?: string
  }) {
    const globalTheme = useGlobalTheme()
    const scopedTheme = React.useMemo(
      () => (theme ? mergeTheme(globalTheme, theme) : globalTheme),
      [globalTheme, theme],
    )

    return (
      <ScopedThemeContext.Provider value={scopedTheme}>
        {children}
      </ScopedThemeContext.Provider>
    )
  })

  return {
    mergeTheme,
    GlobalThemeProvider,
    ScopedThemeProvider,
    useGlobalTheme,
    useScopedTheme,
  }
}
