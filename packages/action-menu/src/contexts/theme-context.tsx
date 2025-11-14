import * as React from 'react'
import { mergeClassNames, mergeSlotProps } from '../lib/merge-props.js'
import { defaultSlots } from '../lib/slots.js'
import type { ActionMenuTheme, ActionMenuThemeDef } from '../types.js'

export const mergeTheme = <T,>(
  a?: ActionMenuTheme<T>,
  b?: ActionMenuThemeDef<T> | ActionMenuTheme<T>,
): ActionMenuTheme<T> => ({
  slots: { ...(a?.slots as any), ...(b?.slots as any) },
  slotProps: mergeSlotProps(a?.slotProps, b?.slotProps),
  classNames: mergeClassNames(a?.classNames ?? {}, b?.classNames ?? {}),
})

const GlobalThemeContext = React.createContext<ActionMenuTheme<any>>({
  slots: defaultSlots(),
})

export const useGlobalTheme = <T,>() =>
  React.useContext(GlobalThemeContext) as ActionMenuTheme<T>

export const GlobalThemeProvider = React.memo(function GlobalThemeProvider<T>({
  theme,
  children,
}: {
  theme: ActionMenuTheme<T>
  children: React.ReactNode
}) {
  const value = React.useMemo(() => theme, [theme])
  return (
    <GlobalThemeContext.Provider value={value}>
      {children}
    </GlobalThemeContext.Provider>
  )
})

const ScopedThemeContext = React.createContext<ActionMenuTheme<any>>({
  slots: defaultSlots(),
})

export const useScopedTheme = <T,>() =>
  React.useContext(ScopedThemeContext) as ActionMenuTheme<T>

export const ScopedThemeProvider = React.memo(function ScopedThemeProvider<T>({
  theme,
  children,
  __scopeId,
}: {
  theme: ActionMenuTheme<T>
  children: React.ReactNode
  __scopeId?: string
}) {
  const globalTheme = useGlobalTheme()
  const scopedTheme = React.useMemo(
    () => mergeTheme(globalTheme, theme as any),
    [globalTheme, theme],
  )

  return (
    <ScopedThemeContext.Provider value={scopedTheme}>
      {children}
    </ScopedThemeContext.Provider>
  )
})
