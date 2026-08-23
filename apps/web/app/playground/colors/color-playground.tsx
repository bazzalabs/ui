'use client'

import {
  ColorInputError,
  type GeneratedTheme,
  generateTheme,
  serializeTheme,
  type ThemeInput,
  ThemeInputError,
} from '@bazza-ui/colors'
import { useDeferredValue, useEffect, useRef, useState } from 'react'
import { ButtonMatrix } from './components/button-matrix'
import { Diagnostics } from './components/diagnostics'
import { ThemeControls } from './components/theme-controls'
import { TokenInspector } from './components/token-inspector'

const defaultInput: ThemeInput = {
  neutral: '#737373',
  accent: '#2563eb',
  contrast: 50,
  focusStrategy: 'accent',
  stateStrategy: 'overlay',
  prefix: 'bui',
}

type InputError = Readonly<{
  path: string
  message: string
}>

export function ColorPlayground() {
  const [input, setInput] = useState<ThemeInput>(defaultInput)
  const deferredInput = useDeferredValue(input)
  const [theme, setTheme] = useState<GeneratedTheme>(() =>
    generateTheme(defaultInput),
  )
  const lastGeneratedInput = useRef<ThemeInput>(defaultInput)
  const [inputError, setInputError] = useState<InputError | null>(null)

  useEffect(() => {
    if (deferredInput === lastGeneratedInput.current) {
      setInputError(null)
      return
    }

    try {
      const generated = generateTheme(deferredInput)
      lastGeneratedInput.current = deferredInput
      setTheme(generated)
      setInputError(null)
    } catch (error) {
      if (
        error instanceof ThemeInputError ||
        error instanceof ColorInputError
      ) {
        setInputError({ path: error.path, message: error.message })
        return
      }
      throw error
    }
  }, [deferredInput])

  return (
    <main>
      <style data-color-playground-theme>{serializeTheme(theme)}</style>

      <section className="border-border border-b border-dashed">
        <div className="mx-auto grid w-full max-w-screen-2xl gap-6 border-border border-dashed px-4 py-10 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.48fr)] xl:border-x xl:px-8">
          <div className="max-w-3xl">
            <p className="mb-3 font-mono text-muted-foreground text-xs uppercase tracking-[0.18em]">
              Diagnostic lab
            </p>
            <h1 className="text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
              Color system playground
            </h1>
            <p className="mt-4 max-w-2xl text-balance text-muted-foreground text-sm leading-6 sm:text-base">
              Tune seeds and generation strategies, then inspect both modes,
              component states, emitted tokens, and accessibility gates side by
              side.
            </p>
          </div>
          <div className="self-end rounded-lg border bg-muted/20 p-4 font-mono text-xs leading-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Preview status</span>
              <output
                className={
                  inputError ? 'font-medium text-destructive' : 'font-medium'
                }
              >
                {inputError ? 'Showing last valid theme' : 'Generated'}
              </output>
            </div>
            <div className="mt-2 flex items-center justify-between gap-4 border-t pt-2">
              <span className="text-muted-foreground">Prefix</span>
              <span>{theme.prefix}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-screen-2xl items-start border-border border-dashed xl:grid-cols-[22rem_minmax(0,1fr)] xl:border-x">
        <aside className="border-border border-b border-dashed p-4 sm:p-6 xl:sticky xl:top-12 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto xl:border-r xl:border-b-0">
          <ThemeControls
            input={input}
            error={inputError}
            onChange={setInput}
            onReset={() => setInput(defaultInput)}
          />
        </aside>

        <div className="min-w-0 space-y-8 p-4 sm:p-6 xl:p-8">
          <section aria-labelledby="matrix-heading">
            <div className="mb-4">
              <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.16em]">
                Component output
              </p>
              <h2 id="matrix-heading" className="mt-1 font-semibold text-2xl">
                Button state matrix
              </h2>
            </div>
            <div className="space-y-6">
              <div
                data-bui-theme="light"
                className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-0)] p-4 text-[var(--color-foreground-default)] sm:p-6"
              >
                <ButtonMatrix mode="Light" />
              </div>
              <div
                data-bui-theme="dark"
                className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-0)] p-4 text-[var(--color-foreground-default)] sm:p-6"
              >
                <ButtonMatrix mode="Dark" />
              </div>
            </div>
          </section>

          <TokenInspector theme={theme} />
          <Diagnostics theme={theme} />
        </div>
      </div>
    </main>
  )
}
