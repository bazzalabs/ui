import { converter } from 'culori'
import { describe, expect, it } from 'vitest'
import {
  type ButtonDiagnostic,
  type ButtonVariant,
  type CoreDiagnostic,
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
const buttonVariants: readonly ButtonVariant[] = [
  'primary-neutral',
  'primary-accent',
  'destructive',
  'outline',
  'secondary',
  'ghost',
  'link',
]
const colors = (
  theme: ReturnType<typeof generateTheme>,
  mode: 'light' | 'dark',
) =>
  getThemeDeclarations(theme, mode).flatMap(
    ({ value }) => value.match(/oklch\([^)]*\)/g) ?? [],
  )

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
const yieldToRunner = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0))

function assertButtonDiagnostics(
  generated: ReturnType<typeof generateTheme>['light'],
) {
  const diagnostics = generated.diagnostics.filter(
    (diagnostic): diagnostic is ButtonDiagnostic =>
      diagnostic.path.startsWith('button.'),
  )
  invariant(diagnostics.length === 143, 'expected 143 Button diagnostics')

  const pathCount = (path: string) =>
    diagnostics.filter((diagnostic) => diagnostic.path === path).length
  for (const variant of buttonVariants) {
    const transparent = variant === 'ghost' || variant === 'link'
    for (const state of ['rest', 'hover', 'active', 'focus'] as const) {
      invariant(
        pathCount(`button.${variant}.${state}.foreground`) ===
          (transparent ? 6 : 1),
        `unexpected ${variant}.${state} foreground coverage`,
      )
      if (variant === 'outline')
        invariant(
          pathCount(`button.${variant}.${state}.border`) === 5,
          `unexpected ${variant}.${state} border coverage`,
        )
    }
    invariant(
      pathCount(`button.${variant}.focus.inner`) === 1,
      `unexpected ${variant} inner-focus coverage`,
    )
    invariant(
      pathCount(`button.${variant}.focus.outer`) === 5,
      `unexpected ${variant} outer-focus coverage`,
    )
    for (const state of ['hover', 'active'] as const)
      invariant(
        pathCount(`button.${variant}.state.${state}`) ===
          (variant === 'link' ? 0 : 1),
        `unexpected ${variant}.${state} state coverage`,
      )
  }
  invariant(
    pathCount('button.link.hover.underline') === 1,
    'expected the link underline diagnostic',
  )

  for (const diagnostic of diagnostics) {
    if (diagnostic.kind === 'informational') continue
    if ('renderedRest' in diagnostic) {
      const measured = getColorDifference(
        parseColorSeed(diagnostic.renderedRest),
        parseColorSeed(diagnostic.renderedState),
      )
      invariant(
        diagnostic.required ===
          (diagnostic.path.endsWith('.hover') ? 0.015 : 0.025),
        `unexpected state threshold at ${diagnostic.path}`,
      )
      invariant(
        diagnostic.measured === measured,
        `incorrect state measurement at ${diagnostic.path}`,
      )
      invariant(
        measured >= diagnostic.required && diagnostic.pass,
        `failed state gate at ${diagnostic.path}`,
      )
      continue
    }
    const measured = getContrastRatio(
      parseColorSeed(diagnostic.foreground),
      parseColorSeed(diagnostic.background),
    )
    invariant(
      diagnostic.required === (diagnostic.property === 'foreground' ? 4.5 : 3),
      `unexpected contrast threshold at ${diagnostic.path}`,
    )
    invariant(
      diagnostic.measured === measured,
      `incorrect contrast measurement at ${diagnostic.path}`,
    )
    invariant(
      measured >= diagnostic.required && diagnostic.pass,
      `failed contrast gate at ${diagnostic.path}`,
    )
  }
}

function assertCorpus(input: Parameters<typeof generateTheme>[0]) {
  const theme = generateTheme(input)
  for (const mode of ['light', 'dark'] as const) {
    const generated = theme[mode]
    const surfaces = [0, 1, 2, 3, 4].map((depth) =>
      parseColorSeed(generated.tokens.surface[depth as 0 | 1 | 2 | 3 | 4]),
    )
    invariant(
      surfaces.every(
        (surface, index) => index === 0 || surface.l >= surfaces[index - 1]!.l,
      ),
      'surface lightness must be monotonic',
    )
    for (const value of colors(theme, mode))
      invariant(inSrgb(value), `out-of-gamut declaration: ${value}`)
    const foreground = ['strong', 'default', 'muted'].map((name) =>
      parseColorSeed(
        generated.tokens.foreground[name as 'strong' | 'default' | 'muted'],
      ),
    )
    if (mode === 'light') {
      invariant(foreground[0]!.l < foreground[1]!.l, 'strong foreground order')
      invariant(foreground[1]!.l < foreground[2]!.l, 'muted foreground order')
    } else {
      invariant(foreground[0]!.l > foreground[1]!.l, 'strong foreground order')
      invariant(foreground[1]!.l > foreground[2]!.l, 'muted foreground order')
    }
    invariant(
      getColorDifference(foreground[0]!, foreground[1]!) >= 0.015,
      'strong/default foreground difference',
    )
    invariant(
      getColorDifference(foreground[1]!, foreground[2]!) >= 0.015,
      'default/muted foreground difference',
    )
    const borders = ['subtle', 'default', 'strong'].map((name) =>
      parseColorSeed(
        generated.tokens.border[name as 'subtle' | 'default' | 'strong'],
      ),
    )
    invariant(
      getColorDifference(borders[0]!, borders[1]!) >= 0.01,
      'subtle/default border difference',
    )
    invariant(
      getColorDifference(borders[1]!, borders[2]!) >= 0.01,
      'default/strong border difference',
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
      path,
      foregroundValue,
      backgroundValue,
      required,
    ] of requiredPairs)
      invariant(
        getContrastRatio(
          parseColorSeed(foregroundValue),
          parseColorSeed(backgroundValue),
        ) >= required,
        `failed core contrast gate at ${path}`,
      )
    const coreDiagnostics = generated.diagnostics.filter(
      (diagnostic): diagnostic is CoreDiagnostic =>
        !diagnostic.path.startsWith('button.'),
    )
    const gated = coreDiagnostics.filter(
      (diagnostic) => diagnostic.kind === 'gated',
    )
    invariant(gated.length === 26, 'expected 26 core gated diagnostics')
    invariant(
      new Set(
        gated.map(
          (diagnostic) =>
            `${diagnostic.path}|${diagnostic.foreground}|${diagnostic.background}`,
        ),
      ).size === 26,
      'core gated diagnostics must be unique',
    )
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
      invariant(diagnostic, `missing core diagnostic at ${path}`)
      invariant(
        diagnostic.required === required,
        `incorrect threshold at ${path}`,
      )
      invariant(
        diagnostic.measured ===
          getContrastRatio(
            parseColorSeed(foregroundValue),
            parseColorSeed(backgroundValue),
          ),
        `incorrect measurement at ${path}`,
      )
      invariant(diagnostic.pass, `failed core diagnostic at ${path}`)
    }
    const informational = coreDiagnostics.filter(
      (diagnostic) => diagnostic.kind === 'informational',
    )
    invariant(
      informational.length === 15,
      'expected 15 core informational diagnostics',
    )
    invariant(
      informational.filter((diagnostic) => diagnostic.path === 'border.subtle')
        .length === 5,
      'expected five subtle-border diagnostics',
    )
    invariant(
      informational.filter((diagnostic) => diagnostic.path === 'border.default')
        .length === 5,
      'expected five default-border diagnostics',
    )
    invariant(
      informational.filter(
        (diagnostic) => diagnostic.path === 'foreground.disabled',
      ).length === 5,
      'expected five disabled-foreground diagnostics',
    )
    for (const diagnostic of informational)
      invariant(
        diagnostic.measured ===
          getContrastRatio(
            parseColorSeed(diagnostic.foreground),
            parseColorSeed(diagnostic.background),
          ),
        `incorrect informational measurement at ${diagnostic.path}`,
      )
    const borderContrast = borders.map((border) =>
      Math.min(...surfaces.map((surface) => getContrastRatio(border, surface))),
    )
    invariant(borderContrast[0]! <= borderContrast[1]!, 'subtle border order')
    invariant(borderContrast[1]! <= borderContrast[2]!, 'strong border order')
    assertButtonDiagnostics(generated)
  }
}

describe('core themes', () => {
  for (const chroma of [0.08, 0.2, 0.35])
    for (const neutral of [
      oklch(0.5, 0, 0),
      oklch(0.55, 0.03, 45),
      oklch(0.5, 0.03, 225),
    ])
      it(`covers neutral corpus chroma ${chroma} neutral ${neutral}`, async () => {
        await yieldToRunner()
        for (let hue = 0; hue < 360; hue += 30)
          for (let contrast = 0; contrast <= 100; contrast++)
            for (const stateStrategy of ['overlay', 'explicit'] as const)
              assertCorpus({
                neutral,
                accent: oklch(0.6, chroma, hue),
                contrast,
                stateStrategy,
              })
      }, 120_000)

  it('covers accent corpus', async () => {
    await yieldToRunner()
    for (const accent of [
      oklch(0.6, 0.2, 240),
      oklch(0.6, 0.2, 60),
      oklch(0.6, 0.2, 0),
    ])
      for (const chroma of [0, 0.02, 0.04])
        for (let hue = 0; hue < 360; hue += 60)
          for (const contrast of [0, 50, 100])
            for (const stateStrategy of ['overlay', 'explicit'] as const)
              assertCorpus({
                neutral: oklch(0.5, chroma, hue),
                accent,
                contrast,
                stateStrategy,
              })
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
