'use client'

import {
  type GeneratedTheme,
  getThemeDeclarations,
  type ThemeMode,
} from '@bazza-ui/colors'
import { useState } from 'react'
import { Label } from '@/components/ui/label'

const selectClassName =
  'h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

export function TokenInspector({ theme }: { theme: GeneratedTheme }) {
  const [mode, setMode] = useState<ThemeMode>('light')
  const tokens = theme[mode].tokens
  const core = [
    ['Surface 0', '--color-surface-0', tokens.surface[0]],
    ['Surface 1', '--color-surface-1', tokens.surface[1]],
    ['Surface 2', '--color-surface-2', tokens.surface[2]],
    ['Surface 3', '--color-surface-3', tokens.surface[3]],
    ['Surface 4', '--color-surface-4', tokens.surface[4]],
    [
      'Foreground strong',
      '--color-foreground-strong',
      tokens.foreground.strong,
    ],
    [
      'Foreground default',
      '--color-foreground-default',
      tokens.foreground.default,
    ],
    ['Foreground muted', '--color-foreground-muted', tokens.foreground.muted],
    [
      'Foreground disabled',
      '--color-foreground-disabled',
      tokens.foreground.disabled,
    ],
    ['Border subtle', '--color-border-subtle', tokens.border.subtle],
    ['Border default', '--color-border-default', tokens.border.default],
    ['Border strong', '--color-border-strong', tokens.border.strong],
    ['Focus ring', '--color-focus-ring', tokens.focus.ring],
    [
      'Selection background',
      '--color-selection-background',
      tokens.selection.background,
    ],
    [
      'Selection foreground',
      '--color-selection-foreground',
      tokens.selection.foreground,
    ],
  ] as const
  const effects = [
    ['Shadow 0', '--color-shadow-0', tokens.shadow[0]],
    ['Shadow 1', '--color-shadow-1', tokens.shadow[1]],
    ['Shadow 2', '--color-shadow-2', tokens.shadow[2]],
    ['Shadow 3', '--color-shadow-3', tokens.shadow[3]],
    ['Shadow 4', '--color-shadow-4', tokens.shadow[4]],
    ['Accent glow', '--color-glow-accent', tokens.glow.accent],
  ] as const
  const declarations = getThemeDeclarations(theme, mode)

  return (
    <section
      aria-labelledby="tokens-heading"
      className="rounded-xl border p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.16em]">
            Emitted values
          </p>
          <h2 id="tokens-heading" className="mt-1 font-semibold text-2xl">
            Token inspector
          </h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="inspector-mode">Inspector mode</Label>
          <select
            id="inspector-mode"
            className={selectClassName}
            value={mode}
            onChange={(event) =>
              setMode(event.currentTarget.value as ThemeMode)
            }
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>

      <div
        data-bui-theme={mode}
        className="mt-6 space-y-6 rounded-lg bg-[var(--color-surface-0)] p-4 text-[var(--color-foreground-default)]"
      >
        <div>
          <h3 className="mb-3 font-medium">Core colors</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {core.map(([label, alias, value]) => (
              <div
                key={alias}
                className="overflow-hidden rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-1)]"
              >
                <div
                  className="h-14 border-[var(--color-border-subtle)] border-b"
                  style={{ background: `var(${alias})` }}
                />
                <div className="p-3">
                  <p className="font-medium text-xs">{label}</p>
                  <code className="mt-1 block break-all text-[10px] text-[var(--color-foreground-muted)]">
                    {value}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-medium">Effects</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {effects.map(([label, alias, value]) => (
              <div
                key={alias}
                className="rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-1)] p-3"
              >
                <div
                  className="mb-4 h-14 rounded-md bg-[var(--color-surface-2)]"
                  style={{ boxShadow: `var(${alias})` }}
                />
                <p className="font-medium text-xs">{label}</p>
                <code className="mt-1 block break-all text-[10px] text-[var(--color-foreground-muted)]">
                  {value}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>

      <details className="mt-6 rounded-md border">
        <summary className="cursor-pointer select-none px-4 py-3 font-medium text-sm marker:text-muted-foreground">
          Raw declarations ({declarations.length})
        </summary>
        <section
          className="max-h-[32rem] overflow-auto border-t"
          aria-label={`${mode} raw theme declarations`}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll the declaration table.
          tabIndex={0}
        >
          <table className="w-full min-w-[46rem] text-left font-mono text-xs">
            <thead className="sticky top-0 bg-background">
              <tr>
                <th className="border-b px-3 py-2 font-medium">Variable</th>
                <th className="border-b px-3 py-2 font-medium">Value</th>
                <th className="border-b px-3 py-2 font-medium">Path</th>
              </tr>
            </thead>
            <tbody>
              {declarations.map((declaration) => (
                <tr key={declaration.name} data-testid="theme-declaration">
                  <td className="border-b px-3 py-2">{declaration.name}</td>
                  <td className="max-w-md break-all border-b px-3 py-2">
                    {declaration.value}
                  </td>
                  <td className="border-b px-3 py-2 text-muted-foreground">
                    {declaration.path}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </details>
    </section>
  )
}
