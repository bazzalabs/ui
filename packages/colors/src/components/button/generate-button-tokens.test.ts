import { converter } from 'culori'
import { describe, expect, it } from 'vitest'
import {
  compositeColors,
  formatOklch,
  generateTheme,
  getColorDifference,
  getContrastRatio,
  getThemeDeclarations,
  mapToSrgb,
  type OklchColor,
  parseColorSeed,
  presets,
} from '../../index.js'
import { buttonVariants } from './generate-button-tokens.js'

const toRgb = converter('rgb')
const inSrgb = (value: string) => {
  const rgb = toRgb(parseColorSeed(value))!
  return [rgb.r, rgb.g, rgb.b].every((channel) => channel >= 0 && channel <= 1)
}
const canonical = (value: OklchColor) =>
  parseColorSeed(formatOklch(mapToSrgb(value)))
const expectedState = (
  rest: string,
  mode: 'light' | 'dark',
  strategy: 'overlay' | 'explicit',
  contrast: number,
  state: 'hover' | 'active',
) => {
  const base = parseColorSeed(rest)
  const t = contrast / 100
  const required = state === 'hover' ? 0.015 : 0.025
  const initial =
    strategy === 'overlay'
      ? state === 'hover'
        ? 0.06 + 0.04 * t
        : 0.1 + 0.06 * t
      : state === 'hover'
        ? 0.035 + 0.025 * t
        : 0.065 + 0.035 * t
  const valueAt = (amount: number) =>
    canonical(
      strategy === 'overlay'
        ? compositeColors(
            parseColorSeed(mode === 'light' ? 'oklch(0 0 0)' : 'oklch(1 0 0)'),
            base,
            amount,
          )
        : mapToSrgb({
            mode: 'oklch',
            l: base.l + ((mode === 'light' ? 0.1 : 0.99) - base.l) * amount,
            c: base.c * (1 - amount * 0.6),
            h: base.h,
            alpha: 1,
          }),
    )
  let amount = initial
  let value = valueAt(amount)
  while (getColorDifference(value, base) < required && amount < 1) {
    amount = Math.min(1, amount + 0.005)
    value = valueAt(amount)
  }
  return formatOklch(value)
}

describe('experimental button tokens', () => {
  it('emits seven variants, four states, and both identical strategies', () => {
    for (const strategy of ['overlay', 'explicit'] as const) {
      const theme = generateTheme({
        neutral: '#737373',
        accent: '#2563eb',
        contrast: 50,
        stateStrategy: strategy,
      })
      const button = theme.light.components.button
      expect(Object.keys(button)).toEqual(buttonVariants)
      for (const variant of buttonVariants) {
        expect(Object.keys(button[variant])).toEqual([
          'rest',
          'hover',
          'active',
          'focus',
        ])
        for (const state of ['rest', 'hover', 'active', 'focus'] as const) {
          const token = button[variant][state]
          expect(Object.keys(token)).toEqual([
            'background',
            'foreground',
            'border',
            'boxShadow',
          ])
        }
      }
      expect(button.ghost.rest.background).toBe('transparent')
      expect(button.link.rest.background).toBe('transparent')
      expect(button.ghost.rest.boxShadow).toBe('none')
      expect(button.link.rest.boxShadow).toBe('none')
      expect(button['primary-neutral'].rest.border).not.toBe('transparent')
      expect(button['primary-accent'].rest.border).not.toBe('transparent')
      expect(button.destructive.rest.border).not.toBe('transparent')
      for (const variant of [
        'primary-neutral',
        'primary-accent',
        'destructive',
        'outline',
        'secondary',
      ] as const)
        expect(button[variant].rest.boxShadow.split(', ')).toHaveLength(3)
      expect(button['primary-accent'].focus.boxShadow).toContain(
        'inset 0 0 0 3px',
      )
      expect(button['primary-accent'].focus.boxShadow).toContain('0 0 0 3px')
      expect(
        theme.light.diagnostics.some(
          (diagnostic) => diagnostic.path === 'button.link.hover.underline',
        ),
      ).toBe(true)
    }
  })

  it('applies the exact emitted overlay and explicit state formulas', () => {
    for (const contrast of [0, 50, 100])
      for (const strategy of ['overlay', 'explicit'] as const) {
        const theme = generateTheme({
          neutral: '#737373',
          accent: '#2563eb',
          contrast,
          stateStrategy: strategy,
        })
        for (const mode of ['light', 'dark'] as const) {
          const states = theme[mode].components.button['primary-neutral']
          for (const state of ['hover', 'active'] as const)
            expect(states[state].background).toBe(
              expectedState(
                states.rest.background,
                mode,
                strategy,
                contrast,
                state,
              ),
            )
        }
      }
  })

  it('independently verifies emitted gates for every preset, mode, and strategy', () => {
    for (const preset of presets)
      for (const mode of ['light', 'dark'] as const)
        for (const strategy of ['overlay', 'explicit'] as const) {
          const theme = generateTheme({
            ...preset.input,
            stateStrategy: strategy,
          })
          const generated = theme[mode]
          const button = generated.components.button
          expect(button.outline.rest.foreground).toBe(
            generated.tokens.foreground.default,
          )
          expect(button.secondary.rest.foreground).toBe(
            generated.tokens.foreground.default,
          )
          expect(parseColorSeed(button.link.rest.foreground).c).toBeGreaterThan(
            0,
          )
          const declarations = getThemeDeclarations(theme, mode)
          for (const value of declarations.flatMap(
            ({ value }) => value.match(/oklch\([^)]*\)/g) ?? [],
          ))
            expect(inSrgb(value)).toBe(true)
          for (const variant of buttonVariants) {
            const states = button[variant]
            for (const state of ['rest', 'hover', 'active', 'focus'] as const) {
              const token = states[state]
              const backgrounds =
                token.background === 'transparent'
                  ? Object.values(generated.tokens.surface)
                  : [token.background]
              for (const background of backgrounds)
                expect(
                  getContrastRatio(
                    parseColorSeed(token.foreground),
                    parseColorSeed(background),
                  ),
                ).toBeGreaterThanOrEqual(4.5)
              if (variant === 'outline')
                for (const surface of Object.values(generated.tokens.surface))
                  expect(
                    getContrastRatio(
                      parseColorSeed(token.border),
                      parseColorSeed(surface),
                    ),
                  ).toBeGreaterThanOrEqual(3)
            }
            for (const state of ['hover', 'active'] as const) {
              if (variant === 'link') continue
              const rest =
                states.rest.background === 'transparent'
                  ? generated.tokens.surface[0]
                  : states.rest.background
              const current =
                states[state].background === 'transparent'
                  ? generated.tokens.surface[0]
                  : states[state].background
              expect(
                getColorDifference(
                  parseColorSeed(rest),
                  parseColorSeed(current),
                ),
              ).toBeGreaterThanOrEqual(state === 'hover' ? 0.015 : 0.025)
            }
            const focusColors =
              states.focus.boxShadow.match(/oklch\([^)]*\)/g) ?? []
            expect(focusColors).toHaveLength(2)
            const renderedRest =
              states.rest.background === 'transparent'
                ? generated.tokens.surface[0]
                : states.rest.background
            expect(
              getContrastRatio(
                parseColorSeed(focusColors[0]!),
                parseColorSeed(renderedRest),
              ),
            ).toBeGreaterThanOrEqual(3)
            for (const surface of Object.values(generated.tokens.surface))
              expect(
                getContrastRatio(
                  parseColorSeed(focusColors[1]!),
                  parseColorSeed(surface),
                ),
              ).toBeGreaterThanOrEqual(3)
          }
          const buttonDiagnostics = generated.diagnostics.filter((diagnostic) =>
            diagnostic.path.startsWith('button.'),
          )
          expect(buttonDiagnostics).toHaveLength(143)
          expect(
            buttonDiagnostics.filter(
              (diagnostic) => diagnostic.path === 'button.link.hover.underline',
            ),
          ).toHaveLength(1)
          expect(
            buttonDiagnostics.filter(
              (diagnostic) => diagnostic.kind === 'gated' && !diagnostic.pass,
            ),
          ).toHaveLength(0)
        }
  }, 120_000)
})
