import {
  compositeColors,
  findAccessibleForeground,
  formatOklch,
  getColorDifference,
  getContrastRatio,
  mapToSrgb,
  parseColorSeed,
} from '../../color.js'
import { emitted } from '../../theme/core.js'
import type {
  CoreTokens,
  ResolvedModeInput,
  ThemeMode,
} from '../../theme/types.js'
import type { OklchColor } from '../../types.js'
import type {
  ButtonContrastDiagnostic,
  ButtonDiagnostic,
  ButtonStateDifferenceDiagnostic,
  ButtonStateStrategy,
  ButtonStateTokens,
  ButtonTokens,
  ButtonVariant,
  ButtonVariantTokens,
} from './types.js'

export const buttonVariants: readonly ButtonVariant[] = [
  'primary-neutral',
  'primary-accent',
  'destructive',
  'outline',
  'secondary',
  'ghost',
  'link',
]
const color = (l: number, c: number, h: number): OklchColor =>
  mapToSrgb({ mode: 'oklch', l, c, h, alpha: 1 })
const canonical = (value: OklchColor): [OklchColor, string] => {
  const [, text] = emitted(value)
  return [
    parseColorSeed(formatOklch(parseColorSeed(text))),
    formatOklch(parseColorSeed(text)),
  ]
}
const ratio = (foreground: string, background: string): number =>
  getContrastRatio(parseColorSeed(foreground), parseColorSeed(background))
const accessible = (
  candidate: OklchColor,
  backgrounds: readonly OklchColor[],
): string => {
  const renderedBackgrounds = backgrounds.map(
    (background) => canonical(background)[0],
  )
  const passes = (value: OklchColor) =>
    renderedBackgrounds.every(
      (background) => getContrastRatio(value, background) >= 4.5,
    )
  const [renderedCandidate, candidateCss] = canonical(candidate)
  if (passes(renderedCandidate)) return candidateCss

  const passing: [OklchColor, string][] = []
  for (const endpoint of [0, 1]) {
    const endpointValue = canonical(
      color(endpoint, renderedCandidate.c, renderedCandidate.h),
    )[0]
    if (!passes(endpointValue)) continue
    let failing = renderedCandidate.l
    let succeeding = endpoint
    for (let attempt = 0; attempt < 16; attempt++) {
      const lightness = (failing + succeeding) / 2
      const value = canonical(
        color(lightness, renderedCandidate.c, renderedCandidate.h),
      )[0]
      if (passes(value)) succeeding = lightness
      else failing = lightness
    }
    const result = canonical(
      color(succeeding, renderedCandidate.c, renderedCandidate.h),
    )
    if (passes(result[0])) passing.push(result)
  }
  if (passing.length)
    return passing.sort(
      ([a], [b]) =>
        Math.abs(a.l - renderedCandidate.l) -
        Math.abs(b.l - renderedCandidate.l),
    )[0]![1]
  return canonical(
    findAccessibleForeground(renderedBackgrounds, renderedCandidate, 4.5),
  )[1]
}
const overlay = (
  base: OklchColor,
  mode: ThemeMode,
  alpha: number,
): OklchColor =>
  compositeColors(color(mode === 'light' ? 0 : 1, 0, 0), base, alpha)
const explicit = (
  base: OklchColor,
  mode: ThemeMode,
  delta: number,
): OklchColor =>
  mapToSrgb({
    mode: 'oklch',
    l: base.l + ((mode === 'light' ? 0.1 : 0.99) - base.l) * delta,
    c: base.c * (1 - delta * 0.6),
    h: base.h,
    alpha: 1,
  })
const accessibleFill = (base: OklchColor): OklchColor => {
  const baseCss = canonical(base)[1]
  if (
    ratio('oklch(0.01 0 0)', baseCss) >= 4.5 ||
    ratio('oklch(0.99 0 0)', baseCss) >= 4.5
  )
    return base
  const order = Array.from({ length: 101 }, (_, index) => index / 100).sort(
    (a, b) => Math.abs(a - base.l) - Math.abs(b - base.l),
  )
  for (const lightness of order) {
    const value = canonical(color(lightness, base.c, base.h))[0]
    const valueCss = canonical(value)[1]
    if (
      ratio('oklch(0.01 0 0)', valueCss) >= 4.5 ||
      ratio('oklch(0.99 0 0)', valueCss) >= 4.5
    )
      return value
  }
  return base
}
const gated = (
  path: string,
  property: ButtonContrastDiagnostic['property'],
  foreground: string,
  background: string,
  required: number,
): ButtonContrastDiagnostic => {
  const measured = ratio(foreground, background)
  return {
    kind: 'gated',
    path,
    property,
    foreground,
    background,
    measured,
    required,
    pass: measured >= required,
  }
}

export function generateButtonTokens(
  input: ResolvedModeInput,
  mode: ThemeMode,
  core: CoreTokens,
  strategy: ButtonStateStrategy,
  destructive?: string,
): { tokens: ButtonTokens; diagnostics: readonly ButtonDiagnostic[] } {
  const neutral = parseColorSeed(input.neutral)
  const accent = parseColorSeed(input.accent)
  const surfaces = [0, 1, 2, 3, 4].map((depth) =>
    parseColorSeed(core.surface[depth as 0 | 1 | 2 | 3 | 4]),
  )
  const foregroundCache = new Map<string, string>()
  const foregroundFor = (
    candidate: OklchColor,
    backgrounds: readonly OklchColor[],
  ) => {
    const key = [candidate, ...backgrounds]
      .map((value) => formatOklch(value))
      .join('|')
    const cached = foregroundCache.get(key)
    if (cached) return cached
    const foreground = accessible(candidate, backgrounds)
    foregroundCache.set(key, foreground)
    return foreground
  }
  const dark = mode === 'dark'
  const solidNeutral = color(
    dark ? 0.86 : 0.22,
    Math.min(neutral.c, 0.12),
    neutral.h,
  )
  const solidAccent = accessibleFill(mapToSrgb(accent))
  const solidDestructive = accessibleFill(
    destructive ? parseColorSeed(destructive) : color(0.58, 0.22, 27),
  )
  const fill = (variant: ButtonVariant): [OklchColor, OklchColor, boolean] => {
    if (variant === 'primary-neutral')
      return [solidNeutral, color(dark ? 0.1 : 0.99, 0.02, neutral.h), false]
    if (variant === 'primary-accent')
      return [solidAccent, color(dark ? 0.1 : 0.99, 0.02, neutral.h), false]
    if (variant === 'destructive')
      return [
        solidDestructive,
        color(dark ? 0.1 : 0.99, 0.02, neutral.h),
        false,
      ]
    if (variant === 'outline')
      return [
        parseColorSeed(core.surface[1]),
        parseColorSeed(core.foreground.default),
        false,
      ]
    if (variant === 'secondary')
      return [
        parseColorSeed(core.surface[2]),
        parseColorSeed(core.foreground.default),
        false,
      ]
    if (variant === 'ghost')
      return [
        parseColorSeed(core.surface[0]),
        color(dark ? 0.99 : 0.01, Math.min(neutral.c, 0.04), neutral.h),
        true,
      ]
    return [parseColorSeed(core.surface[0]), accent, true]
  }
  const diagnostics: ButtonDiagnostic[] = []
  const tokens = {} as Record<ButtonVariant, ButtonVariantTokens>
  for (const variant of buttonVariants) {
    const [base, candidate, transparent] = fill(variant)
    const restRendered = canonical(base)[0]
    const restBackground = transparent ? 'transparent' : canonical(base)[1]
    const border =
      variant === 'outline'
        ? core.border.strong
        : variant === 'secondary'
          ? core.border.default
          : variant === 'ghost' || variant === 'link'
            ? 'transparent'
            : canonical(overlay(restRendered, mode, 0.12))[1]
    const renderedFor = (
      state: 'rest' | 'hover' | 'active' | 'focus',
    ): [OklchColor, string] => {
      if (
        state === 'rest' ||
        state === 'focus' ||
        (transparent && variant === 'link')
      )
        return [restRendered, canonical(restRendered)[1]]
      const t = input.contrast / 100
      const required =
        state === 'hover' ? 0.015 : state === 'active' ? 0.025 : 0
      const initial =
        strategy === 'overlay'
          ? state === 'hover'
            ? 0.06 + 0.04 * t
            : 0.1 + 0.06 * t
          : state === 'hover'
            ? 0.035 + 0.025 * t
            : 0.065 + 0.035 * t
      let amount = initial
      let value = canonical(
        strategy === 'overlay'
          ? overlay(restRendered, mode, amount)
          : explicit(restRendered, mode, amount),
      )[0]
      while (
        required &&
        getColorDifference(value, restRendered) < required &&
        amount < 1
      ) {
        amount = Math.min(1, amount + 0.005)
        value = canonical(
          strategy === 'overlay'
            ? overlay(restRendered, mode, amount)
            : explicit(restRendered, mode, amount),
        )[0]
      }
      return [value, canonical(value)[1]]
    }
    const make = (
      state: 'rest' | 'hover' | 'active' | 'focus',
    ): ButtonStateTokens => {
      const [rendered, backgroundValue] = renderedFor(state)
      const background =
        transparent &&
        (variant === 'link' || state === 'rest' || state === 'focus')
          ? 'transparent'
          : backgroundValue
      const foregroundBackgrounds =
        variant === 'ghost' || variant === 'link'
          ? [rendered, ...surfaces]
          : [rendered]
      const foreground = foregroundFor(candidate, foregroundBackgrounds)
      const neutralDrop = `0 2px 6px rgb(0 0 0 / ${dark ? '0.24' : '0.12'})`
      const shadow =
        variant === 'ghost' || variant === 'link'
          ? 'none'
          : state === 'active'
            ? `inset 0 1px 0 ${core.border.subtle}, 0 0 0 1px ${border}`
            : `inset 0 1px 0 rgb(255 255 255 / 0.08), 0 0 0 1px ${border}, ${neutralDrop}`
      return { background, foreground, border, boxShadow: shadow }
    }
    const rest = make('rest')
    const hover = make('hover')
    const active = make('active')
    const focusBase = make('focus')
    const inner = accessible(dark ? color(0.01, 0, 0) : color(0.99, 0, 0), [
      restRendered,
    ])
    const outer = core.focus.ring
    const focus: ButtonStateTokens = {
      ...focusBase,
      background: rest.background,
      foreground: focusBase.foreground,
      boxShadow: `inset 0 0 0 3px ${inner}, 0 0 0 3px ${outer}`,
    }
    tokens[variant] = { rest, hover, active, focus }
    for (const [state, token] of [
      ['rest', rest],
      ['hover', hover],
      ['active', active],
      ['focus', focus],
    ] as const) {
      const rendered =
        transparent &&
        (variant === 'link' || state === 'rest' || state === 'focus')
          ? restRendered
          : parseColorSeed(token.background)
      const backgrounds = transparent ? [rendered, ...surfaces] : [rendered]
      for (const background of backgrounds)
        diagnostics.push(
          gated(
            `button.${variant}.${state}.foreground`,
            'foreground',
            token.foreground,
            canonical(background)[1],
            4.5,
          ),
        )
      if (variant === 'outline')
        for (const surface of surfaces)
          diagnostics.push(
            gated(
              `button.${variant}.${state}.border`,
              'border',
              token.border,
              canonical(surface)[1],
              3,
            ),
          )
      if (state === 'focus') {
        diagnostics.push(
          gated(
            `button.${variant}.focus.inner`,
            'focus-shadow',
            inner,
            canonical(restRendered)[1],
            3,
          ),
        )
        for (const surface of surfaces)
          diagnostics.push(
            gated(
              `button.${variant}.focus.outer`,
              'focus-shadow',
              outer,
              canonical(surface)[1],
              3,
            ),
          )
      }
    }
    for (const state of ['hover', 'active'] as const) {
      if (variant === 'link') continue
      const stateToken = tokens[variant][state]
      const rendered = parseColorSeed(stateToken.background)
      const required = state === 'hover' ? 0.015 : 0.025
      const measured = getColorDifference(restRendered, rendered)
      const diagnostic: ButtonStateDifferenceDiagnostic = {
        kind: 'gated',
        path: `button.${variant}.state.${state}`,
        property: 'background',
        rest: restBackground,
        state: stateToken.background,
        renderedRest: canonical(restRendered)[1],
        renderedState: canonical(rendered)[1],
        measured,
        required,
        pass: measured >= required,
      }
      diagnostics.push(diagnostic)
    }
    if (variant === 'link')
      diagnostics.push({
        kind: 'informational',
        path: 'button.link.hover.underline',
        property: 'underline',
        foreground: tokens.link.rest.foreground,
        background: 'transparent',
        measured: 0,
      })
  }
  return { tokens, diagnostics }
}
