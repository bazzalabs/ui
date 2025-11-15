import * as React from 'react'
import { defaultSlots } from '@bazza-ui/menu'
import type { CommandMenuTheme, CommandMenuThemeDef } from '../types.js'

/**
 * Merges class names by combining them with a space
 */
const mergeClassNames = (
  a: Record<string, string | undefined>,
  b: Record<string, string | undefined>,
): Record<string, string | undefined> => {
  const result: Record<string, string | undefined> = { ...a }
  for (const key in b) {
    if (b[key]) {
      result[key] = result[key] ? `${result[key]} ${b[key]}` : b[key]
    }
  }
  return result
}

/**
 * Merges slot props by combining them
 */
const mergeSlotProps = (
  a?: Record<string, any>,
  b?: Record<string, any>,
): Record<string, any> => {
  if (!a && !b) return {}
  if (!a) return { ...b }
  if (!b) return { ...a }

  const result: Record<string, any> = { ...a }
  for (const key in b) {
    if (b[key] !== undefined) {
      result[key] = b[key]
    }
  }
  return result
}

/**
 * Merges two themes, with b overriding a
 */
export const mergeTheme = <T,>(
  a?: CommandMenuTheme<T>,
  b?: CommandMenuThemeDef<T> | CommandMenuTheme<T>,
): CommandMenuTheme<T> => ({
  slots: { ...(a?.slots as any), ...(b?.slots as any) },
  slotProps: mergeSlotProps(a?.slotProps, b?.slotProps),
  classNames: mergeClassNames(a?.classNames ?? {}, b?.classNames ?? {}),
})

/**
 * Global theme context - provides the merged factory + instance theme
 */
const GlobalThemeContext = React.createContext<CommandMenuTheme<any>>({
  slots: defaultSlots(),
})

export const useGlobalTheme = <T,>() =>
  React.useContext(GlobalThemeContext) as CommandMenuTheme<T>

export const GlobalThemeProvider = React.memo(function GlobalThemeProvider<T>({
  theme,
  children,
}: {
  theme: CommandMenuTheme<T>
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
 * Scoped theme context - provides menu/submenu level theme merged with global
 */
const ScopedThemeContext = React.createContext<CommandMenuTheme<any>>({
  slots: defaultSlots(),
})

export const useScopedTheme = <T,>() =>
  React.useContext(ScopedThemeContext) as CommandMenuTheme<T>

export const ScopedThemeProvider = React.memo(function ScopedThemeProvider<T>({
  theme,
  children,
}: {
  theme?: CommandMenuTheme<T>
  children: React.ReactNode
}) {
  const globalTheme = useGlobalTheme()
  const scopedTheme = React.useMemo(
    () => (theme ? mergeTheme(globalTheme, theme as any) : globalTheme),
    [globalTheme, theme],
  )

  return (
    <ScopedThemeContext.Provider value={scopedTheme}>
      {children}
    </ScopedThemeContext.Provider>
  )
})
