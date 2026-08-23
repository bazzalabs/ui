import { converter } from 'culori'
import {
  compositeColors,
  formatOklch,
  getColorDifference,
  getContrastRatio,
  mapToSrgb,
  parseColorSeed,
} from '../color.js'
import type { OklchColor } from '../types.js'
import { contrastT, surfaceChroma, surfaceLightness } from './curves.js'
import type {
  CoreTokens,
  GeneratedMode,
  ResolvedModeInput,
  ThemeDiagnostic,
  ThemeMode,
} from './types.js'
import { ThemeInputError } from './types.js'

const color = (l: number, c: number, h: number): OklchColor =>
  mapToSrgb({ mode: 'oklch', l, c, h, alpha: 1 })
const toRgb = converter('rgb')

/** The emitted string is the source of truth for every generated gate. */
export const emitted = (value: OklchColor): [OklchColor, string] => {
  let candidate = mapToSrgb(value)
  for (let attempt = 0; attempt < 128; attempt++) {
    const parsed = parseColorSeed(formatOklch(candidate))
    const rgb = toRgb(parsed)!
    if ([rgb.r, rgb.g, rgb.b].every((channel) => channel >= 0 && channel <= 1))
      return [parsed, formatOklch(parsed)]
    candidate = mapToSrgb({
      ...candidate,
      l: Math.min(0.9999, Math.max(0.0001, candidate.l)),
      c: candidate.c * 0.95,
    })
  }
  const parsed = parseColorSeed(formatOklch(mapToSrgb({ ...candidate, c: 0 })))
  return [parsed, formatOklch(parsed)]
}

const interpolateOklch = (
  from: OklchColor,
  to: OklchColor,
  fraction: number,
): OklchColor =>
  color(
    from.l + (to.l - from.l) * fraction,
    from.c + (to.c - from.c) * fraction,
    from.h + (to.h - from.h) * fraction,
  )

const contrast = (foreground: OklchColor, backgrounds: readonly OklchColor[]) =>
  Math.min(
    ...backgrounds.map((background) =>
      getContrastRatio(foreground, background),
    ),
  )
const alpha = (value: number): string => Number(value.toFixed(4)).toString()

const gate = (
  path: string,
  foreground: string,
  background: string,
  required: number,
): ThemeDiagnostic => {
  const measured = getContrastRatio(
    parseColorSeed(foreground),
    parseColorSeed(background),
  )
  return {
    kind: 'gated',
    path,
    foreground,
    background,
    measured,
    required,
    pass: measured >= required,
  }
}

const info = (
  path: string,
  foreground: string,
  background: string,
): ThemeDiagnostic => ({
  kind: 'informational',
  path,
  foreground,
  background,
  measured: getContrastRatio(
    parseColorSeed(foreground),
    parseColorSeed(background),
  ),
})

export function getSurfaceColor(
  input: ResolvedModeInput & { mode?: ThemeMode },
  depth: number,
): string {
  if (input === null || typeof input !== 'object')
    throw new ThemeInputError('invalid-input', 'input', input)
  if (typeof input.neutral !== 'string')
    throw new ThemeInputError('invalid-input', 'neutral', input.neutral)
  if (typeof input.accent !== 'string')
    throw new ThemeInputError('invalid-input', 'accent', input.accent)
  if (
    !Number.isFinite(input.contrast) ||
    input.contrast < 0 ||
    input.contrast > 100
  )
    throw new ThemeInputError('invalid-contrast', 'contrast', input.contrast)
  if (!Number.isFinite(depth) || depth < 0 || depth > 8)
    throw new ThemeInputError('invalid-input', 'depth', depth)
  const mode = input.mode ?? 'light'
  if (mode !== 'light' && mode !== 'dark')
    throw new ThemeInputError('invalid-input', 'mode', mode)
  const neutral = parseColorSeed(input.neutral, 'neutral')
  parseColorSeed(input.accent, 'accent')
  const lightness = surfaceLightness(mode, depth, input.contrast)
  return emitted(
    color(
      lightness,
      surfaceChroma(mode, lightness, Math.min(neutral.c, 0.04)),
      neutral.h,
    ),
  )[1]
}

const searchEmitted = (
  mode: ThemeMode,
  target: number,
  hue: number,
  chroma: number,
  backgrounds: readonly OklchColor[],
  minimum: number,
  previous?: OklchColor,
): [OklchColor, string] => {
  const candidates = Array.from(
    { length: 1001 },
    (_, index) => index / 1000,
  ).sort((a, b) => Math.abs(a - target) - Math.abs(b - target) || a - b)
  for (const lightness of candidates) {
    const [value, css] = emitted(color(lightness, chroma, hue))
    if (contrast(value, backgrounds) < minimum) continue
    if (previous && getColorDifference(value, previous) < 0.015) continue
    return [value, css]
  }
  throw new ThemeInputError(
    'invalid-input',
    `generated.${mode}.accessibility`,
    formatOklch(color(target, chroma, hue)),
  )
}

export function generateMode(
  input: ResolvedModeInput,
  mode: ThemeMode,
  focusStrategy: 'accent' | 'neutral',
): GeneratedMode {
  const neutral = parseColorSeed(input.neutral, 'neutral')
  const accent = parseColorSeed(input.accent, 'accent')
  const t = contrastT(input.contrast)
  const surfaces: OklchColor[] = []
  const surfaceCss: string[] = []
  for (let depth = 0; depth <= 4; depth++) {
    const lightness = surfaceLightness(mode, depth, input.contrast)
    const [value, css] = emitted(
      color(
        lightness,
        surfaceChroma(mode, lightness, Math.min(neutral.c, 0.04)),
        neutral.h,
      ),
    )
    surfaces.push(value)
    surfaceCss.push(css)
  }

  const foreground: string[] = []
  const foregroundValues: OklchColor[] = []
  for (const target of mode === 'light'
    ? [0.1, 0.18, 0.4]
    : [0.99, 0.92, 0.72]) {
    const [value, css] = searchEmitted(
      mode,
      target,
      neutral.h,
      Math.min(neutral.c, 0.04) / 2,
      surfaces,
      4.5,
      foregroundValues.at(-1),
    )
    foregroundValues.push(value)
    foreground.push(css)
  }

  const minimumBorderContrast = (value: OklchColor) => contrast(value, surfaces)
  const borderFor = (
    start: number,
    previous: OklchColor | undefined,
    required: number,
  ): [OklchColor, string] => {
    for (let fraction = start; fraction <= 1; fraction += 0.0025) {
      const [value, css] = emitted(
        interpolateOklch(surfaces[0]!, foregroundValues[0]!, fraction),
      )
      if (previous && getColorDifference(value, previous) < 0.01) continue
      if (minimumBorderContrast(value) < required) continue
      if (
        previous &&
        minimumBorderContrast(value) < minimumBorderContrast(previous)
      )
        continue
      return [value, css]
    }
    throw new ThemeInputError(
      'invalid-input',
      `generated.${mode}.border`,
      start,
    )
  }
  const [subtle, subtleCss] = borderFor(0.08 + 0.04 * t, undefined, 0)
  const [borderDefault, defaultCss] = borderFor(0.16 + 0.06 * t, subtle, 0)
  const [strong, strongCss] = borderFor(0.3 + 0.08 * t, borderDefault, 3)

  const focusTarget = mode === 'light' ? 0.1 : 0.99
  const neutralStrategy = color(
    focusTarget,
    Math.min(neutral.c, 0.04),
    neutral.h,
  )
  const strategy = focusStrategy === 'accent' ? accent : neutralStrategy
  const [focusValue, focusCss] = searchEmitted(
    mode,
    focusTarget,
    strategy.h,
    strategy.c,
    surfaces,
    3,
  )
  const selectionValue = emitted(
    interpolateOklch(surfaces[0]!, strategy, 0.12 + 0.08 * t),
  )[0]
  const [, selectionCss] = emitted(selectionValue)
  const [selectionForeground, selectionForegroundCss] = searchEmitted(
    mode,
    focusTarget,
    neutral.h,
    Math.min(neutral.c, 0.04) / 2,
    [selectionValue],
    4.5,
  )

  const dropAlpha =
    mode === 'light'
      ? (level: number) => alpha(0.08 + level * 0.015 * t)
      : (level: number) => alpha(0.24 + level * 0.02 * t)
  const insetAlpha = alpha(0.05 + 0.03 * t)
  const shadows = ['none'] as string[]
  const drops = ['0 1px 2px', '0 2px 6px', '0 6px 16px', '0 12px 32px']
  for (let level = 1; level <= 4; level++)
    shadows.push(
      `inset 0 1px 0 rgb(255 255 255 / ${insetAlpha}), 0 0 0 1px ${defaultCss}, ${drops[level - 1]} rgb(0 0 0 / ${dropAlpha(level)})`,
    )
  const [, accentCss] = emitted(accent)
  const glow = `0 0 0 1px ${accentCss}, 0 8px 24px rgb(0 0 0 / ${alpha(0.14 + 0.08 * t)})`

  const tokens: CoreTokens = {
    surface: {
      0: surfaceCss[0]!,
      1: surfaceCss[1]!,
      2: surfaceCss[2]!,
      3: surfaceCss[3]!,
      4: surfaceCss[4]!,
    },
    foreground: {
      strong: foreground[0]!,
      default: foreground[1]!,
      muted: foreground[2]!,
      disabled: foreground[1]!,
    },
    border: { subtle: subtleCss, default: defaultCss, strong: strongCss },
    focus: { ring: focusCss },
    selection: { background: selectionCss, foreground: selectionForegroundCss },
    shadow: {
      0: shadows[0]!,
      1: shadows[1]!,
      2: shadows[2]!,
      3: shadows[3]!,
      4: shadows[4]!,
    },
    glow: { accent: glow },
    opacity: { disabled: '0.5' },
  }
  const diagnostics: ThemeDiagnostic[] = []
  for (const [name, value] of [
    ['strong', foreground[0]!],
    ['default', foreground[1]!],
    ['muted', foreground[2]!],
  ] as const)
    for (const background of surfaceCss)
      diagnostics.push(gate(`foreground.${name}`, value, background, 4.5))
  for (const background of surfaceCss) {
    diagnostics.push(
      gate('border.strong', strongCss, background, 3),
      gate('focus.ring', focusCss, background, 3),
    )
    const effective = emitted(
      compositeColors(foregroundValues[1]!, parseColorSeed(background), 0.5),
    )[1]
    diagnostics.push(info('foreground.disabled', effective, background))
  }
  diagnostics.push(
    gate('selection.foreground', selectionForegroundCss, selectionCss, 4.5),
  )
  for (const background of surfaceCss)
    diagnostics.push(
      info('border.subtle', subtleCss, background),
      info('border.default', defaultCss, background),
    )
  void subtle
  void selectionForeground
  void strong
  void focusValue
  return { input, tokens, diagnostics }
}
