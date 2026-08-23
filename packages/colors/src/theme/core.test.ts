import { converter } from 'culori'
import { describe, expect, it } from 'vitest'
import {
  generateTheme,
  getColorDifference,
  getContrastRatio,
  getSurfaceColor,
  getThemeDeclarations,
  parseColorSeed,
} from '../index.js'

const toRgb = converter('rgb')
const inSrgb = (value: string) => {
  const rgb = toRgb(parseColorSeed(value))!
  return [rgb.r, rgb.g, rgb.b].every((channel) => channel >= 0 && channel <= 1)
}
const oklch = (l: number, c: number, h: number) => `oklch(${l} ${c} ${h})`
const colors = (
  theme: ReturnType<typeof generateTheme>,
  mode: 'light' | 'dark',
) =>
  getThemeDeclarations(theme, mode).flatMap(
    ({ value }) => value.match(/oklch\([^)]*\)/g) ?? [],
  )

function assertCorpus(input: Parameters<typeof generateTheme>[0]) {
  const theme = generateTheme(input)
  for (const mode of ['light', 'dark'] as const) {
    const generated = theme[mode]
    const surfaces = [0, 1, 2, 3, 4].map((depth) =>
      parseColorSeed(generated.tokens.surface[depth as 0 | 1 | 2 | 3 | 4]),
    )
    expect(surfaces.map((value) => value.l)).toEqual(
      [...surfaces.map((value) => value.l)].sort((a, b) => a - b),
    )
    for (const value of colors(theme, mode)) expect(inSrgb(value)).toBe(true)
    const foreground = ['strong', 'default', 'muted'].map((name) =>
      parseColorSeed(
        generated.tokens.foreground[name as 'strong' | 'default' | 'muted'],
      ),
    )
    if (mode === 'light') {
      expect(foreground[0]!.l).toBeLessThan(foreground[1]!.l)
      expect(foreground[1]!.l).toBeLessThan(foreground[2]!.l)
    } else {
      expect(foreground[0]!.l).toBeGreaterThan(foreground[1]!.l)
      expect(foreground[1]!.l).toBeGreaterThan(foreground[2]!.l)
    }
    expect(
      getColorDifference(foreground[0]!, foreground[1]!),
    ).toBeGreaterThanOrEqual(0.015)
    expect(
      getColorDifference(foreground[1]!, foreground[2]!),
    ).toBeGreaterThanOrEqual(0.015)
    const borders = ['subtle', 'default', 'strong'].map((name) =>
      parseColorSeed(
        generated.tokens.border[name as 'subtle' | 'default' | 'strong'],
      ),
    )
    expect(getColorDifference(borders[0]!, borders[1]!)).toBeGreaterThanOrEqual(
      0.01,
    )
    expect(getColorDifference(borders[1]!, borders[2]!)).toBeGreaterThanOrEqual(
      0.01,
    )
    const requiredPairs = [
      ...(['strong', 'default', 'muted'] as const).flatMap((name) =>
        surfaces.map(
          (_, index) =>
            [
              `foreground.${name}`,
              generated.tokens.foreground[name],
              generated.tokens.surface[index as 0 | 1 | 2 | 3 | 4],
              4.5,
            ] as const,
        ),
      ),
      ...surfaces.flatMap((_, index) => [
        [
          'focus.ring',
          generated.tokens.focus.ring,
          generated.tokens.surface[index as 0 | 1 | 2 | 3 | 4],
          3,
        ] as const,
        [
          'border.strong',
          generated.tokens.border.strong,
          generated.tokens.surface[index as 0 | 1 | 2 | 3 | 4],
          3,
        ] as const,
      ]),
      [
        'selection.foreground',
        generated.tokens.selection.foreground,
        generated.tokens.selection.background,
        4.5,
      ] as const,
    ]
    for (const [
      _path,
      foregroundValue,
      backgroundValue,
      required,
    ] of requiredPairs)
      expect(
        getContrastRatio(
          parseColorSeed(foregroundValue),
          parseColorSeed(backgroundValue),
        ),
      ).toBeGreaterThanOrEqual(required)
    const gated = generated.diagnostics.filter(
      (diagnostic) => diagnostic.kind === 'gated',
    )
    expect(gated).toHaveLength(26)
    expect(
      new Set(
        gated.map(
          (diagnostic) =>
            `${diagnostic.path}|${diagnostic.foreground}|${diagnostic.background}`,
        ),
      ).size,
    ).toBe(26)
    for (const [
      path,
      foregroundValue,
      backgroundValue,
      required,
    ] of requiredPairs) {
      const diagnostic = gated.find(
        (candidate) =>
          candidate.path === path &&
          candidate.foreground === foregroundValue &&
          candidate.background === backgroundValue,
      )
      expect(diagnostic).toBeDefined()
      expect(diagnostic!.required).toBe(required)
      expect(diagnostic!.measured).toBe(
        getContrastRatio(
          parseColorSeed(foregroundValue),
          parseColorSeed(backgroundValue),
        ),
      )
      expect(diagnostic!.pass).toBe(true)
    }
    const informational = generated.diagnostics.filter(
      (diagnostic) => diagnostic.kind === 'informational',
    )
    expect(informational).toHaveLength(15)
    expect(
      informational.filter((diagnostic) => diagnostic.path === 'border.subtle'),
    ).toHaveLength(5)
    expect(
      informational.filter(
        (diagnostic) => diagnostic.path === 'border.default',
      ),
    ).toHaveLength(5)
    expect(
      informational.filter(
        (diagnostic) => diagnostic.path === 'foreground.disabled',
      ),
    ).toHaveLength(5)
    for (const diagnostic of informational)
      expect(diagnostic.measured).toBe(
        getContrastRatio(
          parseColorSeed(diagnostic.foreground),
          parseColorSeed(diagnostic.background),
        ),
      )
    const borderContrast = borders.map((border) =>
      Math.min(...surfaces.map((surface) => getContrastRatio(border, surface))),
    )
    expect(borderContrast[0]).toBeLessThanOrEqual(borderContrast[1]!)
    expect(borderContrast[1]).toBeLessThanOrEqual(borderContrast[2]!)
  }
}

describe('core themes', () => {
  it('covers the exact deterministic theme corpus', () => {
    const neutrals = [
      oklch(0.5, 0, 0),
      oklch(0.55, 0.03, 45),
      oklch(0.5, 0.03, 225),
    ]
    for (const neutral of neutrals)
      for (const chroma of [0.08, 0.2, 0.35])
        for (let hue = 0; hue < 360; hue += 30)
          for (let contrast = 0; contrast <= 100; contrast++)
            assertCorpus({ neutral, accent: oklch(0.6, chroma, hue), contrast })
    const accents = [
      oklch(0.6, 0.2, 240),
      oklch(0.6, 0.2, 60),
      oklch(0.6, 0.2, 0),
    ]
    for (const accent of accents)
      for (const chroma of [0, 0.02, 0.04])
        for (let hue = 0; hue < 360; hue += 60)
          for (const contrast of [0, 50, 100])
            assertCorpus({ neutral: oklch(0.5, chroma, hue), accent, contrast })
  }, 120_000)

  it('validates defaults, paths, boundaries, modes, and strategies', () => {
    const input = { neutral: '#777', accent: '#06c', contrast: 50 }
    expect(generateTheme(input)).toEqual(generateTheme(input))
    expect(generateTheme(input).input).toMatchObject({
      prefix: 'bui',
      focusStrategy: 'accent',
      stateStrategy: 'overlay',
    })
    expect(generateTheme({ ...input, contrast: 0 }).light.input.contrast).toBe(
      0,
    )
    expect(generateTheme({ ...input, contrast: 100 }).dark.input.contrast).toBe(
      100,
    )
    expect(() => generateTheme({ ...input, contrast: -1 })).toThrowError(
      expect.objectContaining({
        code: 'invalid-contrast',
        path: 'contrast',
        input: -1,
      }),
    )
    expect(() => generateTheme({ ...input, contrast: 101 })).toThrowError(
      expect.objectContaining({
        code: 'invalid-contrast',
        path: 'contrast',
        input: 101,
      }),
    )
    expect(() => generateTheme({ ...input, neutral: 'bad' })).toThrowError(
      expect.objectContaining({ path: 'neutral' }),
    )
    expect(() =>
      generateTheme({ ...input, modes: { dark: { accent: 'bad' } } }),
    ).toThrowError(expect.objectContaining({ path: 'modes.dark.accent' }))
    for (const prefix of ['color', 'button'])
      expect(() => generateTheme({ ...input, prefix })).toThrowError(
        expect.objectContaining({ code: 'reserved-prefix' }),
      )
    expect(() =>
      generateTheme({ ...input, prefix: null as never }),
    ).toThrowError(
      expect.objectContaining({ code: 'invalid-prefix', path: 'prefix' }),
    )
    expect(
      generateTheme({
        ...input,
        modes: { dark: { contrast: 75, neutral: '#444' } },
        focusStrategy: 'neutral',
        stateStrategy: 'explicit',
      }).dark.input.contrast,
    ).toBe(75)
    expect(() =>
      generateTheme({ ...input, focusStrategy: 'invalid' as never }),
    ).toThrowError(expect.objectContaining({ path: 'focusStrategy' }))
    expect(() =>
      generateTheme({ ...input, stateStrategy: 'invalid' as never }),
    ).toThrowError(expect.objectContaining({ path: 'stateStrategy' }))
    for (const value of [null, 42, {}])
      expect(() =>
        generateTheme({ ...input, neutral: value as never }),
      ).toThrowError(
        expect.objectContaining({
          code: 'invalid-input',
          path: 'neutral',
          input: value,
        }),
      )
    for (const value of [null, 42])
      expect(() =>
        generateTheme({ ...input, accent: value as never }),
      ).toThrowError(
        expect.objectContaining({
          code: 'invalid-input',
          path: 'accent',
          input: value,
        }),
      )
    expect(() =>
      generateTheme({ ...input, destructive: null as never }),
    ).toThrowError(
      expect.objectContaining({ path: 'destructive', input: null }),
    )
    for (const value of [null, 42])
      expect(() =>
        generateTheme({ ...input, modes: value as never }),
      ).toThrowError(expect.objectContaining({ path: 'modes', input: value }))
    expect(() =>
      generateTheme({ ...input, modes: { light: null as never } }),
    ).toThrowError(
      expect.objectContaining({ path: 'modes.light', input: null }),
    )
    expect(() =>
      generateTheme({ ...input, modes: { dark: { neutral: null as never } } }),
    ).toThrowError(
      expect.objectContaining({ path: 'modes.dark.neutral', input: null }),
    )
    expect(() =>
      generateTheme({ ...input, modes: { dark: { extra: '#fff' } as never } }),
    ).toThrowError(expect.objectContaining({ path: 'modes.dark.extra' }))
    expect(() =>
      generateTheme({ ...input, modes: { extra: {} } as never }),
    ).toThrowError(expect.objectContaining({ path: 'modes.extra' }))
    expect(() =>
      generateTheme({ ...input, modes: { dark: { contrast: null as never } } }),
    ).toThrowError(
      expect.objectContaining({ path: 'modes.dark.contrast', input: null }),
    )
  })

  it('validates surface curves and both focus strategies', () => {
    for (const mode of ['light', 'dark'] as const) {
      const values = Array.from(
        { length: 9 },
        (_, depth) =>
          parseColorSeed(
            getSurfaceColor(
              { neutral: '#777', accent: '#06c', contrast: 50, mode },
              depth,
            ),
          ).l,
      )
      expect(values).toEqual([...values].sort((a, b) => a - b))
    }
    expect(
      parseColorSeed(
        getSurfaceColor(
          { neutral: '#777', accent: '#06c', contrast: 50, mode: 'dark' },
          0.1,
        ),
      ).c,
    ).toBe(0)
    const chromatic = {
      neutral: 'oklch(0.5 0.03 45)',
      accent: '#06c',
      contrast: 0,
      mode: 'dark' as const,
    }
    expect(parseColorSeed(getSurfaceColor(chromatic, 1)).c).toBe(0)
    expect(parseColorSeed(getSurfaceColor(chromatic, 2)).c).toBe(0)
    expect(parseColorSeed(getSurfaceColor(chromatic, 3)).c).toBeGreaterThan(0)
    expect(
      parseColorSeed(
        getSurfaceColor(
          {
            neutral: 'oklch(0.5 0 45)',
            accent: '#06c',
            contrast: 0,
            mode: 'light',
          },
          0,
        ),
      ).l,
    ).toBe(0.965)
    expect(
      parseColorSeed(
        getSurfaceColor(
          {
            neutral: 'oklch(0.5 0 45)',
            accent: '#06c',
            contrast: 100,
            mode: 'dark',
          },
          4,
        ),
      ).l,
    ).toBe(0.25)
    expect(() =>
      getSurfaceColor({ neutral: '#777', accent: '#06c', contrast: 101 }, 0),
    ).toThrowError(expect.objectContaining({ path: 'contrast', input: 101 }))
    expect(() =>
      getSurfaceColor({ neutral: 'bad', accent: '#06c', contrast: 50 }, 0),
    ).toThrowError(expect.objectContaining({ path: 'neutral' }))
    expect(() =>
      getSurfaceColor({ neutral: '#777', accent: 'bad', contrast: 50 }, 0),
    ).toThrowError(expect.objectContaining({ path: 'accent' }))
    expect(() =>
      getSurfaceColor({ neutral: '#777', accent: '#06c', contrast: 50 }, 9),
    ).toThrowError(expect.objectContaining({ path: 'depth' }))
    const focusInput = {
      neutral: 'oklch(0.5 0 30)',
      accent: 'oklch(0.6 0.2 240)',
      contrast: 50,
    }
    const accentFocus = parseColorSeed(
      generateTheme({ ...focusInput, focusStrategy: 'accent' }).light.tokens
        .focus.ring,
    )
    const neutralFocus = parseColorSeed(
      generateTheme({ ...focusInput, focusStrategy: 'neutral' }).light.tokens
        .focus.ring,
    )
    expect(Math.abs(accentFocus.h - neutralFocus.h)).toBeGreaterThan(30)
    const surface = parseColorSeed(getSurfaceColor({ ...focusInput }, 0))
    expect(getContrastRatio(accentFocus, surface)).toBeGreaterThanOrEqual(3)
    expect(getContrastRatio(neutralFocus, surface)).toBeGreaterThanOrEqual(3)
    const neutralLow = generateTheme({
      ...focusInput,
      neutral: 'oklch(0.3 0.04 30)',
      focusStrategy: 'neutral',
    })
    const neutralHigh = generateTheme({
      ...focusInput,
      neutral: 'oklch(0.8 0.04 30)',
      focusStrategy: 'neutral',
    })
    expect(neutralLow.light.tokens.focus.ring).toBe(
      neutralHigh.light.tokens.focus.ring,
    )
    expect(
      generateTheme({
        ...focusInput,
        neutral: 'oklch(0.5 0.2 30)',
        focusStrategy: 'neutral',
      }).light.tokens.focus.ring,
    ).toBe(neutralHigh.light.tokens.focus.ring)
  })
})
