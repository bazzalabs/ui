import { describe, expect, it } from 'vitest'
import {
  generateTheme,
  getContrastRatio,
  getThemeDeclarations,
  parseColorSeed,
  presets,
} from './index.js'

describe('theme presets', () => {
  it('exports the exact seven inputs without strategy fields', () => {
    expect(presets.map(({ id }) => id)).toEqual([
      'warm-red',
      'cool-blue',
      'achromatic-yellow',
      'high-chroma-purple',
      'high-chroma-green',
      'minimum-contrast',
      'maximum-contrast',
    ])
    expect(presets.map(({ id, input }) => ({ id, input }))).toEqual([
      {
        id: 'warm-red',
        input: {
          neutral: 'oklch(0.60 0.025 55)',
          accent: '#e11d48',
          contrast: 50,
        },
      },
      {
        id: 'cool-blue',
        input: {
          neutral: 'oklch(0.60 0.03 250)',
          accent: '#2563eb',
          contrast: 50,
        },
      },
      {
        id: 'achromatic-yellow',
        input: { neutral: '#808080', accent: '#eab308', contrast: 50 },
      },
      {
        id: 'high-chroma-purple',
        input: {
          neutral: '#737373',
          accent: 'oklch(0.55 0.30 300)',
          contrast: 50,
        },
      },
      {
        id: 'high-chroma-green',
        input: {
          neutral: '#737373',
          accent: 'oklch(0.60 0.25 145)',
          contrast: 50,
        },
      },
      {
        id: 'minimum-contrast',
        input: { neutral: '#737373', accent: '#2563eb', contrast: 0 },
      },
      {
        id: 'maximum-contrast',
        input: { neutral: '#737373', accent: '#2563eb', contrast: 100 },
      },
    ])
    for (const preset of presets) {
      expect(preset.input).not.toHaveProperty('stateStrategy')
      expect(preset.input).not.toHaveProperty('focusStrategy')
      expect(() => generateTheme(preset.input)).not.toThrow()
      for (const mode of ['light', 'dark'] as const)
        for (const strategy of ['overlay', 'explicit'] as const) {
          const theme = generateTheme({
            ...preset.input,
            stateStrategy: strategy,
          })
          const generated = theme[mode]
          expect(
            getThemeDeclarations(theme, mode).every(
              ({ value }) => !value.includes('var('),
            ),
          ).toBe(true)
          for (const variant of [
            'primary-neutral',
            'primary-accent',
            'destructive',
            'outline',
            'secondary',
            'ghost',
            'link',
          ] as const)
            for (const state of ['rest', 'hover', 'active', 'focus'] as const) {
              const token = generated.components.button[variant][state]
              const background =
                token.background === 'transparent'
                  ? generated.tokens.surface[0]
                  : token.background
              expect(
                getContrastRatio(
                  parseColorSeed(token.foreground),
                  parseColorSeed(background),
                ),
              ).toBeGreaterThanOrEqual(4.5)
            }
        }
    }
  })
})
