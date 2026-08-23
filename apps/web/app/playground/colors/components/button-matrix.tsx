'use client'

import type { ButtonVariant } from '@bazza-ui/colors'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/registry/ui/colors-button'

const variants: readonly ButtonVariant[] = [
  'primary-neutral',
  'primary-accent',
  'destructive',
  'outline',
  'secondary',
  'ghost',
  'link',
]

const previews = [
  ['rest', ''],
  [
    'hover',
    'bg-[var(--button-background-hover)] text-[var(--button-foreground-hover)] [box-shadow:var(--button-shadow-hover)]',
  ],
  [
    'active',
    'translate-y-px bg-[var(--button-background-active)] text-[var(--button-foreground-active)] [box-shadow:var(--button-shadow-active)]',
  ],
  [
    'focus-visible',
    'bg-[var(--button-background-focus)] text-[var(--button-foreground-focus)] [box-shadow:var(--button-shadow-focus)]',
  ],
] as const

const sizeLabels = [
  ['default', 'Default'],
  ['xs', 'Extra small'],
  ['sm', 'Small'],
  ['lg', 'Large'],
  ['icon', 'Icon'],
  ['icon-xs', 'Icon extra small'],
  ['icon-sm', 'Icon small'],
  ['icon-lg', 'Icon large'],
] as const

export function ButtonMatrix({ mode }: { mode: string }) {
  const [clicks, setClicks] = useState<Record<string, number>>({})

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg">{mode} mode</h3>
          <p className="text-[var(--color-foreground-muted)] text-xs">
            Generated component-local state variables
          </p>
        </div>
        <span className="rounded-full border border-[var(--color-border-default)] px-2 py-1 font-mono text-[10px] text-[var(--color-foreground-muted)] uppercase tracking-wider">
          {mode}
        </span>
      </div>

      <section
        data-testid={`${mode.toLowerCase()}-matrix-overflow`}
        className="overflow-x-auto pb-3"
        aria-label={`${mode} button state matrix`}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll the matrix.
        tabIndex={0}
      >
        <table className="w-full min-w-[72rem] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="font-mono text-[10px] text-[var(--color-foreground-muted)] uppercase tracking-wider">
              <th className="border-[var(--color-border-subtle)] border-b px-2 py-2 font-medium">
                Variant
              </th>
              {[
                ...previews.map(([state]) => state),
                'disabled',
                'loading',
                'interactive',
              ].map((state) => (
                <th
                  key={state}
                  className="border-[var(--color-border-subtle)] border-b px-2 py-2 font-medium"
                >
                  {state}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant} data-testid={`matrix-variant-${variant}`}>
                <th className="border-[var(--color-border-subtle)] border-b px-2 py-3 font-mono font-medium text-xs">
                  {variant}
                </th>
                {previews.map(([state, className]) => (
                  <td
                    key={state}
                    className="border-[var(--color-border-subtle)] border-b px-2 py-3"
                  >
                    <Button
                      variant={variant}
                      inert
                      className={`pointer-events-none ${className} ${
                        variant === 'link' && state === 'hover'
                          ? 'underline'
                          : ''
                      }`}
                      data-testid={`matrix-${variant}-${state}`}
                    >
                      Button
                    </Button>
                  </td>
                ))}
                <td className="border-[var(--color-border-subtle)] border-b px-2 py-3">
                  <Button
                    variant={variant}
                    disabled
                    data-testid={`matrix-${variant}-disabled`}
                  >
                    Disabled
                  </Button>
                </td>
                <td className="border-[var(--color-border-subtle)] border-b px-2 py-3">
                  <Button
                    variant={variant}
                    loading
                    data-testid={`matrix-${variant}-loading`}
                  >
                    Loading
                  </Button>
                </td>
                <td className="border-[var(--color-border-subtle)] border-b px-2 py-3">
                  <Button
                    variant={variant}
                    data-testid={`matrix-${variant}-interactive`}
                    onClick={() =>
                      setClicks((current) => ({
                        ...current,
                        [variant]: (current[variant] ?? 0) + 1,
                      }))
                    }
                  >
                    Try it{clicks[variant] ? ` ${clicks[variant]}` : ''}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-5 border-[var(--color-border-subtle)] border-t pt-5">
        <p className="mb-3 font-mono text-[10px] text-[var(--color-foreground-muted)] uppercase tracking-wider">
          Size scale
        </p>
        <div className="flex min-w-0 flex-wrap items-end gap-3">
          {sizeLabels.map(([size, label]) => {
            const icon = size.startsWith('icon')
            return (
              <div key={size} className="grid justify-items-center gap-2">
                <Button
                  size={size}
                  inert
                  data-testid={`matrix-size-${size}`}
                  aria-label={icon ? label : undefined}
                >
                  {icon ? <Plus /> : label}
                </Button>
                <span className="font-mono text-[10px] text-[var(--color-foreground-muted)]">
                  {size}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
